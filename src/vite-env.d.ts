/// <reference types="vite/client" />

// 本应用不再依赖任何构建期环境变量：
// 域名与 Token 由用户在登录页输入，保存在浏览器会话（src/session.ts）。
// 因此无需声明 VITE_* 环境变量类型。
