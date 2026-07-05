// app/sign-in/[[...sign-in]]/page.tsx
import { SignIn } from '@clerk/nextjs';
import { FolderOpen } from 'lucide-react';

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Side - Branding */}
          <div className="hidden lg:flex flex-col items-start space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 bg-black rounded-2xl flex items-center justify-center shadow-xl shadow-black/10">
                <FolderOpen className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-black">MediaStore</h1>
                <p className="text-sm text-gray-500">Media Management Platform</p>
              </div>
            </div>
            
            <div className="space-y-4 mt-4">
              <h2 className="text-4xl font-bold text-black leading-tight">
                Welcome Back
              </h2>
              <p className="text-lg text-gray-600 max-w-md">
                Sign in to access your media library, upload files, and manage your content securely.
              </p>
              
              <div className="flex items-center gap-6 pt-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-sm text-gray-600">Secure Storage</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <span className="text-sm text-gray-600">Media Management</span>
                </div>
              </div>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-2 gap-3 w-full max-w-md pt-8">
              {[
                '📸 Upload Images',
                '🎬 Video Preview',
                '🎵 Audio Files',
                '🔍 Smart Search',
                '📱 Responsive Design',
                '🔒 Secure Access'
              ].map((feature) => (
                <div key={feature} className="flex items-center gap-2 text-sm text-gray-600 bg-white/80 rounded-xl px-3 py-2.5 border border-gray-100 shadow-sm">
                  <span>{feature}</span>
                </div>
              ))}
            </div>

            <p className="text-xs text-gray-400 mt-8">
              Created by <span className="font-medium text-gray-600">Kafiswe Chimputu Jr</span>
            </p>
          </div>

          {/* Right Side - Sign In Form */}
          <div className="flex flex-col items-center justify-center">
            <div className="w-full max-w-md">
              {/* Mobile Logo */}
              <div className="lg:hidden flex flex-col items-center mb-8">
                <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center shadow-xl shadow-black/10 mb-3">
                  <FolderOpen className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-black">MediaStore</h1>
                <p className="text-sm text-gray-500">Sign in to continue</p>
              </div>

              {/* Sign In Form - Custom Styled */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 sm:p-8">
                <SignIn 
                  appearance={{
                    elements: {
                      rootBox: "w-full",
                      card: "shadow-none w-full p-0 bg-transparent",
                      headerTitle: "hidden",
                      headerSubtitle: "hidden",
                      socialButtonsBlockButton: "w-full flex items-center justify-center gap-2 px-4 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all text-gray-700 font-medium bg-white",
                      socialButtonsBlockButtonText: "text-sm font-medium",
                      dividerLine: "bg-gray-200",
                      dividerText: "text-gray-400 text-sm",
                      formFieldLabel: "text-gray-700 font-medium text-sm mb-1.5",
                      formFieldInput: "w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-black transition-all text-black placeholder:text-gray-400 bg-white",
                      formButtonPrimary: "w-full bg-black hover:bg-gray-800 text-white font-medium py-3 rounded-xl transition-all text-sm shadow-sm hover:shadow-md",
                      footerActionLink: "text-black hover:text-gray-700 font-medium transition-colors",
                      identityPreviewText: "text-gray-700",
                      identityPreviewEditButton: "text-black hover:text-gray-700",
                      otpCodeFieldInput: "w-12 h-12 border border-gray-200 rounded-xl text-center text-xl focus:ring-2 focus:ring-black focus:border-black transition-all",
                      formFieldAction: "text-black hover:text-gray-700 text-sm",
                      alertText: "text-red-500 text-sm",
                      alertIcon: "text-red-500",
                      // Additional styling to ground the form
                      main: "w-full",
                      form: "space-y-4",
                      footer: "mt-6 text-center",
                      footerAction: "text-sm",
                    },
                  }}
                  routing="path"
                  path="/sign-in"
                  signUpUrl="/sign-up"
                  fallbackRedirectUrl="/"
                />
              </div>

              <p className="text-xs text-gray-400 text-center mt-6 lg:hidden">
                Created by <span className="font-medium text-gray-600">Kafiswe Chimputu Jr</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}