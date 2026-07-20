export default function ForgotPasswordBackground() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-gray-50 to-gray-100 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] p-8">
        {/* Title */}
        <h1 className="text-3xl font-bold text-gray-800 text-center mb-2">
          Forgot Password
        </h1>
        <p className="text-gray-500 text-sm text-center mb-8">
          Enter your username to reset your password
        </p>
        <form>
          {/* Input */}
          <div className="relative mb-5">
            <input
              type={"text"}
              className="peer w-full border border-gray-300 rounded-lg px-4 py-3
            text-gray-800 placeholder-transparent outline-none
            focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30"
              placeholder="value"
            />

            <label
              className={`absolute left-4 px-1 bg-white text-gray-500 text-sm
            transition-all duration-200 pointer-events-non top-3 peer-focus:-top-2 peer-focus:text-xs peer-focus:text-emerald-600`}
            >
              Username
            </label>
          </div>

          {/* Toggle */}
          <button
            type="button"
            className="text-sm text-emerald-600 hover:text-emerald-500 transition mb-6 cursor-pointer"
          >
            Forgot username? Use email instead
          </button>

          {/* Submit */}
          <button
            type="submit"
            className="w-full py-3 rounded-lg font-semibold text-white
          bg-emerald-600 hover:bg-emerald-500 transition
          disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            Send Reset Link
          </button>
        </form>
        {/* Footer */}
        <p className="text-xs text-gray-400 text-center mt-6">
          A secure reset code will be sent to you Email
        </p>
      </div>
    </div>
  );
}
