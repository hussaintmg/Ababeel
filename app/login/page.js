"use client";
import React, { useState } from "react";
import Image from "next/image";
import bg from "@/public/log.png";
import { toast } from "react-toastify";
import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useSiteContent } from "@/context/SiteContentContext";
import AuthTheme from "@/Components/cms/AuthTheme";

export default function Page() {
  const router = useRouter();
  const { setUser } = useAuth();
  const { settings } = useSiteContent();
  const auth = settings?.auth?.style || {};
  const hideImg = !!auth.hideLoginImage;

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [remember, setRemember] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post(
        `/api/auth/login`,
        { username, password, remember },
        { withCredentials: true },
      );
      setUser(res.data.user);
      toast.success(res.data.message);
      setUsername("");
      setPassword("");
      setLoading(false);
      router.push("/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.error);
      console.log(err.response?.data?.details);
      console.log(err.response?.data?.error);
      setLoading(false);
    }
  };

  return (
    <div className="cms-auth w-full h-screen flex relative items-center justify-center">
      <AuthTheme />
      {/* Left Image Section */}
      {!hideImg ? (
        <div
          className="w-[60%] h-full relative max-[700px]:w-full"
          style={auth.loginImageWidth ? { width: `${parseInt(auth.loginImageWidth, 10) || 60}%` } : undefined}
        >
          {auth.loginImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={auth.loginImage} alt="Login background" className="w-full h-full object-cover" />
          ) : (
            <Image
              src={bg}
              alt="Login background"
              fill
              className="object-cover"
              priority
            />
          )}
        </div>
      ) : null}

      {/* Login Form Section */}
      <div
        className={
          hideImg
            ? "w-full max-w-md flex px-4"
            : "w-1/2 h-full absolute top-0 left-1/2 flex max-[700px]:w-[80%] max-[700px]:top-1/2 max-[700px]:-translate-1/2 max-[700px]:h-[80%]"
        }
      >
        <div
          className={
            hideImg
              ? "cms-auth-card w-full bg-white border border-stone-200 shadow-xl p-8 sm:p-10 rounded-3xl"
              : "cms-auth-card w-full h-full bg-white border-l border-stone-300 shadow-xl p-[15%] rounded-l-4xl max-[700px]:rounded-4xl max-[700px]:p-[10%]"
          }
        >
          <h2 className="cms-auth-title text-2xl font-semibold text-slate-800 mb-6 text-center">
            Welcome Back
          </h2>

          <form className="space-y-5 w-full" onSubmit={handleLogin}>
            {/* Username */}
            <div className="relative w-full">
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="off"
                placeholder=" "
                className="cms-auth-input peer w-[90%] h-[1cm] text-[1.1rem] rounded-md px-[0.5cm] py-[0.3cm]
               border-b-2 border-[#ccc] bg-transparent outline-none
               transition-all duration-300 focus:shadow-[0_4px_20px_#0f8f4461]
               focus:border-[#0f8f44]"
              />

              <label
                htmlFor="username"
                className={`absolute left-[2%] transition-all duration-300 pointer-events-none
                -top-2 text-[13px] text-[#0f8f44] px-[0.1cm]
                peer-placeholder-shown:top-2 peer-placeholder-shown:text-[16px] peer-placeholder-shown:text-gray-400 peer-placeholder-shown:bg-transparent peer-placeholder-shown:px-0
                peer-focus:-top-3 peer-focus:text-[13px] peer-focus:text-[#0f8f44] peer-focus:bg-black/1 peer-focus:px-[0.1cm]`}
              >
                Username
              </label>
            </div>

            {/* Password */}
            <div className="relative w-full my-5">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder=" "
                className="cms-auth-input peer w-[90%] h-[1cm] text-[1.1rem] rounded-md px-[0.5cm] py-[0.3cm]
               border-b-2 border-[#ccc] bg-transparent outline-none
               transition-all duration-300 focus:shadow-[0_4px_20px_#0f8f4461]
               focus:border-[#0f8f44]"
              />

              <label
                htmlFor="password"
                className={`absolute left-[2%] transition-all duration-300 pointer-events-none
                -top-2 text-[13px] text-[#0f8f44] px-[0.1cm]
                peer-placeholder-shown:top-2 peer-placeholder-shown:text-[16px] peer-placeholder-shown:text-gray-400 peer-placeholder-shown:bg-transparent peer-placeholder-shown:px-0
                peer-focus:-top-3 peer-focus:text-[13px] peer-focus:text-[#0f8f44] peer-focus:bg-black/1 peer-focus:px-[0.1cm]`}
              >
                Password
              </label>

              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setShowPassword(!showPassword)}
                className="absolute top-1/2 transform -translate-y-1/2 left-[83%] text-[#aaa] bg-transparent border-none cursor-pointer transition-all duration-300 hover:text-green-500 max-[700px]:left-[80%]"
              >
                <i
                  className={`fa-solid ${
                    showPassword ? "fa-eye" : "fa-eye-slash"
                  }`}
                ></i>
              </button>
            </div>

            <div className="flex items-center justify-between text-sm max-[400px]:flex-col max-[400px]:justify-self-start max-[700px]:gap-4">
              {/* Remember Me */}
              <div className="flex items-center text-left">
                <input
                  type="checkbox"
                  id="remember"
                  checked={remember}
                  onChange={() => setRemember(!remember)}
                  className="mr-2 accent-[#0f8f44] cursor-pointer"
                />
                <label
                  htmlFor="remember"
                  className="select-none cursor-pointer"
                >
                  Remember me
                </label>
              </div>
              <Link
                href="/forgot-password"
                className="cms-auth-link text-indigo-600 hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              className={`cms-auth-btn cursor-pointer active:translate-y-1 w-full py-2 ${
                loading ? "bg-indigo-500" : "bg-indigo-600"
              }  text-white rounded-md hover:bg-indigo-700 transition`}
            >
              {loading ? "Login..." : "Login"}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}
