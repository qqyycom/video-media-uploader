// callback page server组件

import React from "react";
import { redirect } from "next/navigation";
import AuthClient from "../AuthClient";
import { TikTokAccount } from "@/app/types";

export default async function TikTokCallbackPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  // 从参数中获取code
  const { code, state } = await searchParams;

  if (!code) {
    return (
      <div>
        <h1>授权失败</h1>
        <p>未收到授权码</p>
      </div>
    );
  }

  try {
    // 使用code获取access_token 调用/api/tiktok/auth 接口
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/tiktok/auth?code=${code}&state=${state}`,
      { redirect: "manual" }
    );

    console.log(response);

    // 如果是重定向响应，直接重定向
    const redirectUrl = response.headers.get("Location");
    if (redirectUrl) {
      redirect(redirectUrl);
    }

    // 如果有JSON数据，解析它
    const data = await response.json();
    console.log(data);

    // 如果没有重定向也没有JSON数据，显示成功信息
    return (
      <div>
        <h1>TikTok 授权成功</h1>
        <p>您已成功授权，正在返回首页...</p>
        {/* 使用 client组件将用户绑定信息存到localstorage中 */}
        <AuthClient tiktokAccount={data.account as TikTokAccount} />
      </div>
    );
  } catch (error) {
    if (error instanceof Error && error.message.includes("NEXT_REDIRECT")) {
      throw error;
    }

    console.error("TikTok 授权错误:", error);

    return (
      <div>
        <h1>授权处理失败</h1>
        <p>{(error as Error).message || "未知错误"}</p>
      </div>
    );
  }
}
