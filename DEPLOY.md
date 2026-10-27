# ImgSync Docker 部署（阿里云服务器）

与服务器上既有服务（WireGuard、CivVue/civlensai.com）共存，互不影响。
ImgSync 是纯前端应用，只需一个 HTTP 内部端口，由宿主机 Nginx 反代对外。

## 最终部署决策（2026-10-23 定稿）

- **域名**：`imgsync.civlensai.com`（过渡身份，零成本；未来有产出后购独立域名迁移）
- **部署方式**：阿里云服务器 Docker（本项目 Dockerfile/compose.yaml，见下文）
- **DNS 托管**：Cloudflare——A 记录 `imgsync` 指向服务器公网 IP，橙云代理可选
- **SSL**：Cloudflare 橙云代理可提供边缘证书；源站建议仍用 certbot 或 Cloudflare Origin Certificate（避免回源明文）
- **未来迁移路径**：新域名到位后 → Cloudflare 加新域 DNS → Nginx 加 server 块 → `.env.docker` 改 `NEXT_PUBLIC_URL` → `docker compose up -d --build` → 旧子域 301 到新域（canonical 随构建参数自动切换，代码零改动）
- **内容计划**：目标 20-30 篇原创文章（电商图片规格指南、工具教程），既是 SEO/AdSense 过审基础，也是 affiliate 流量入口


## 架构

```
互联网 ── civvue-nginx 容器(80/443) ── civlensai.com        → CivVue 容器（现有，不动）
                                  └─ imgsync.civlensai.com → imgsync 容器 (3000, 已接入 civvue 网络)
WireGuard（UDP）——独立，不受影响
```

> 2026-10-27 现状：80/443 由 `civvue-nginx` 容器独占，imgsync 的 server 块写在该容器
> 的 `nginx.conf` 内，`proxy_pass` 走容器网络 `imgsync:3000`；宿主机宝塔 nginx 未参与。
> compose 的 `3001:3000` 端口映射保留，便于宿主机直连自检。

## 部署步骤（服务器上执行）

### 1. 上传代码

```bash
git clone <仓库地址> /opt/projects/imgsync && cd /opt/projects/imgsync
```

### 2. 准备环境变量（构建时注入，改了要重新 build）

```bash
cp .env.docker.example .env.docker   # 若无此文件，手动创建：
cat > .env.docker <<'EOF'
NEXT_PUBLIC_URL="https://imgsync.civlensai.com"
EOF
```

`NEXT_PUBLIC_URL` 必填：正式 origin（如 `https://imgsync.civlensai.com`），
sitemap/canonical/OG 都由它生成，同时解除 `indexable=false`。

### 3. 确认端口未被占用

```bash
ss -tlnp | grep 3001   # 无输出 = 可用；被占则改 compose.yaml 里的映射
```

### 4. 构建并启动

```bash
docker compose --env-file .env.docker up -d --build
curl -I http://127.0.0.1:3001   # 期望 200
```

> 注意：compose 默认只读 `.env`，必须显式 `--env-file .env.docker`，
> 否则 `NEXT_PUBLIC_URL` 为空串，构建出的站点 sitemap/canonical 全部失效。

### 5. DNS（域名服务商控制台）

加一条 A 记录：`imgsync.civlensai.com → 服务器公网 IP`

### 6. Nginx 反代（子域名方式，加新 server 块，不动现有配置）

> **宝塔面板用户**：若 CivVue 的反代是经宝塔配置的，imgsync 的站点也应在宝塔里添加
> （网站 → 添加站点 → 绑定 `imgsync.civlensai.com` → 反向代理 `http://127.0.0.1:3001`），
> 不要手写 conf.d 文件，避免面板重载时覆盖手写配置。以下手动配置仅适用于纯手管 Nginx。

`/etc/nginx/conf.d/imgsync.conf`：

```nginx
server {
    listen 80;
    server_name imgsync.civlensai.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    http2 on;
    server_name imgsync.civlensai.com;

    # Let's Encrypt 单域证书（certbot 签发后启用）
    # ssl_certificate     /etc/letsencrypt/live/imgsync.civlensai.com/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/imgsync.civlensai.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

生效：

```bash
nginx -t && systemctl reload nginx
```

证书（若用 certbot，一条命令自动改好 ssl 配置）：

```bash
certbot --nginx -d imgsync.civlensai.com
```

## 域名收敛（www → apex）

`www.imgsync.civlensai.com` 目前是 NXDOMAIN。收敛在 Cloudflare 边缘做，**不改 origin**：
源站证书是 `*.civlensai.com` 泛域名证书，覆盖不到 `www.imgsync.civlensai.com`（两级子域），
让请求回源会证书报错；边缘 301 直接终结，不触达源站。

1. DNS（civlensai.com zone）：添加记录 `CNAME www → imgsync.civlensai.com`，代理开启（橙云）
2. 重定向（Rules → Redirect Rules → Single Redirect / Dynamic redirect）：
   - 条件：`http.host eq "www.imgsync.civlensai.com"`
   - 目标：`concat("https://imgsync.civlensai.com", http.request.uri.path)`
   - 状态：301，保留 query string
3. 验证：`curl -sI https://www.imgsync.civlensai.com/tools` → 301 且 Location 指向 apex 同路径

## 验证清单

- [ ] `curl -I https://imgsync.civlensai.com` → 200
- [ ] `curl https://imgsync.civlensai.com/sitemap.xml` → 含工具与法务路由
- [ ] `curl https://imgsync.civlensai.com/robots.txt` → 含 AI 爬虫 allow
- [ ] `curl https://imgsync.civlensai.com/llms.txt` → 200
- [ ] CivVue（civlensai.com）与 WireGuard 正常如旧

## 更新版本

```bash
cd /opt/projects/imgsync && git pull && docker compose --env-file .env.docker up -d --build
curl -I http://127.0.0.1:3001   # 期望 200
```

> `--env-file .env.docker` 不能省：缺了会读到空 `NEXT_PUBLIC_URL`，构建出的站点
> canonical/OG/sitemap 全部失效。

## 回滚

```bash
docker compose down   # 不影响其他项目（容器名 imgsync 独立）
```
