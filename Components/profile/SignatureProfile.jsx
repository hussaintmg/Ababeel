"use client";

import { useState, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { createApiClient } from "@/utils/api";
import { Upload, Camera, X, Loader2, Check } from "lucide-react";
import { toast } from "react-toastify";

export default function SignatureProfile({ user }) {
  const { getUserData } = useAuth();
  const api = createApiClient();
  
  const [signatureImage, setSignatureImage] = useState(null);
  const [profileImage, setProfileImage] = useState(null);
  const [signaturePreview, setSignaturePreview] = useState(user?.signature?.url || null);
  const [profilePreview, setProfilePreview] = useState(user?.profileImage?.url || null);
  const [isUploadingSignature, setIsUploadingSignature] = useState(false);
  const [isUploadingProfile, setIsUploadingProfile] = useState(false);
  const [isValidatingImage, setIsValidatingImage] = useState(false);
  
  const signatureInputRef = useRef(null);
  const profileInputRef = useRef(null);

  // Check if user already has signature or profile image
  const hasExistingSignature = user?.signature && typeof user.signature === 'string' || user?.signature?.url;
  const hasExistingProfile = user?.profileImage && typeof user.profileImage === 'string' || user?.profileImage?.url;

  // Function to validate image aspect ratio (1:1)
  const validateImageAspectRatio = (file) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      
      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        
        const width = img.width;
        const height = img.height;
        const aspectRatio = width / height;
        
        // Check if aspect ratio is close to 1:1 (allowing small tolerance)
        const isSquare = Math.abs(aspectRatio - 1) < 0.05; // 5% tolerance
        
        if (isSquare) {
          resolve(true);
        } else {
          reject(new Error(`Image must be square (1:1 aspect ratio). Current dimensions: ${width} x ${height} pixels`));
        }
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error("Failed to load image"));
      };
      
      img.src = objectUrl;
    });
  };

  const handleImageSelect = async (type, e) => {
    // Disable if already has existing image
    if (type === 'signature' && hasExistingSignature) {
      toast.error("You already have a signature. Please contact support to change.");
      return;
    }
    
    if (type === 'profile' && hasExistingProfile) {
      toast.error("You already have a profile image. Please contact support to change.");
      return;
    }

    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== "image/png") {
      toast.error("Please select a PNG image");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size should be less than 5MB");
      return;
    }

    // For profile images, validate 1:1 aspect ratio
    if (type === 'profile') {
      setIsValidatingImage(true);
      
      try {
        await validateImageAspectRatio(file);
        
        const reader = new FileReader();
        reader.onloadend = () => {
          setProfileImage(file);
          setProfilePreview(reader.result);
          toast.success("✓ Image meets 1:1 aspect ratio requirement", {
            icon: <Check className="text-green-500" />
          });
          toast.info("Profile image selected. Click upload to save.");
        };
        reader.readAsDataURL(file);
      } catch (error) {
        toast.error(error.message || "Image must be square (1:1 aspect ratio)");
        // Clear the input
        if (profileInputRef.current) {
          profileInputRef.current.value = '';
        }
      } finally {
        setIsValidatingImage(false);
      }
    } else {
      // For signature images, just load normally
      const reader = new FileReader();
      reader.onloadend = () => {
        setSignatureImage(file);
        setSignaturePreview(reader.result);
        toast.info("Signature image selected. Click upload to save.");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadClick = (type) => {
    // Disable if already has existing image
    if (type === 'signature' && hasExistingSignature) {
      toast.error("You already have a signature. Please contact support to change.");
      return;
    }
    
    if (type === 'profile' && hasExistingProfile) {
      toast.error("You already have a profile image. Please contact support to change.");
      return;
    }

    if (type === 'signature') {
      signatureInputRef.current?.click();
    } else {
      profileInputRef.current?.click();
    }
  };

  const uploadSignature = async () => {
    if (!signatureImage) return;

    // Double check - disable if already has existing image
    if (hasExistingSignature) {
      toast.error("You already have a signature. Please contact support to change.");
      return;
    }

    setIsUploadingSignature(true);
    
    try {
      const formData = new FormData();
      formData.append('signature', signatureImage);

      const response = await api.post('/api/profile/upload-signature', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      });

      if (response.data.success) {
        toast.success(
          "Signature uploaded successfully!",
          {
            icon: <Check className="text-green-500" />
          }
        );
        
        setSignatureImage(null);
        setSignaturePreview(response.data.signature?.url);
        
        // Refresh user data
        await getUserData();
      }
    } catch (error) {
      console.error('Signature upload error:', error);
      // Error is already handled by interceptor
    } finally {
      setIsUploadingSignature(false);
    }
  };

  const uploadProfileImage = async () => {
    if (!profileImage) return;

    // Double check - disable if already has existing image
    if (hasExistingProfile) {
      toast.error("You already have a profile image. Please contact support to change.");
      return;
    }

    // Final validation before upload
    setIsValidatingImage(true);
    try {
      await validateImageAspectRatio(profileImage);
    } catch (error) {
      toast.error(error.message || "Image must be square (1:1 aspect ratio)");
      setIsValidatingImage(false);
      return;
    }
    setIsValidatingImage(false);

    setIsUploadingProfile(true);
    
    try {
      const formData = new FormData();
      formData.append('profileImage', profileImage);

      const response = await api.post('/api/profile/upload-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      });

      if (response.data.success) {
        toast.success(
          "Profile image uploaded successfully!",
          {
            icon: <Check className="text-green-500" />
          }
        );
        
        setProfileImage(null);
        setProfilePreview(response.data.profileImage?.url);
        
        // Refresh user data
        await getUserData();
      }
    } catch (error) {
      console.error('Profile image upload error:', error);
      // Error is already handled by interceptor
    } finally {
      setIsUploadingProfile(false);
    }
  };

  const clearImageSelection = (type) => {
    if (type === 'signature') {
      // Disable if already has existing image
      if (hasExistingSignature) {
        toast.error("You already have a signature. Please contact support to change.");
        return;
      }
      
      setSignatureImage(null);
      setSignaturePreview(null);
      if (signatureInputRef.current) signatureInputRef.current.value = '';
      toast.info("Signature selection cleared");
    } else {
      // Disable if already has existing image
      if (hasExistingProfile) {
        toast.error("You already have a profile image. Please contact support to change.");
        return;
      }
      
      setProfileImage(null);
      setProfilePreview(null);
      if (profileInputRef.current) profileInputRef.current.value = '';
      toast.info("Profile image selection cleared");
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4 md:mb-6">Signature & Profile Image</h2>
      
      <div className="space-y-8">
        {/* Signature Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-medium text-gray-900">
                Signature Image
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                PNG format with transparent background • Max 5MB
                {hasExistingSignature && (
                  <span className="text-amber-600 font-medium ml-2">
                    • Already uploaded (Contact support to change)
                  </span>
                )}
              </p>
            </div>
            
            {signatureImage && !hasExistingSignature && (
              <button
                onClick={() => clearImageSelection('signature')}
                className="px-3 py-1.5 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300 transition-colors flex items-center gap-2"
              >
                <X className="w-3 h-3" />
                Clear Selection
              </button>
            )}
          </div>
          
          <div className="flex flex-col items-center">
            <input
              type="file"
              ref={signatureInputRef}
              className="hidden"
              accept=".png,image/png"
              onChange={(e) => handleImageSelect('signature', e)}
              disabled={hasExistingSignature}
            />
            
            <div className="w-full max-w-md">
              <button
                type="button"
                onClick={() => handleUploadClick('signature')}
                disabled={hasExistingSignature}
                className={`relative w-full h-48 border-2 border-dashed rounded-lg transition-colors overflow-hidden group ${
                  hasExistingSignature 
                    ? 'border-gray-200 bg-gray-100 cursor-not-allowed' 
                    : 'border-gray-300 hover:border-blue-500 bg-gray-50'
                }`}
              >
                {signaturePreview ? (
                  <div className="w-full h-full flex flex-col items-center justify-center p-4">
                    <div className="w-full h-32 flex items-center justify-center mb-2">
                      <img 
                        src={signaturePreview} 
                        alt="Signature" 
                        className="max-w-full max-h-full object-contain"
                        onError={(e) => {
                          e.target.src = `https://ui-avatars.com/api/?name=${user?.username || 'User'}&background=random`;
                        }}
                      />
                    </div>
                    <span className={`text-sm ${hasExistingSignature ? 'text-gray-500' : 'text-gray-600'}`}>
                      {signatureImage ? "New signature selected" : "Current signature"}
                    </span>
                    {hasExistingSignature ? (
                      <span className="text-xs text-amber-600 mt-1">
                        Already uploaded - Contact support to change
                      </span>
                    ) : (
                      <span className="text-xs text-gray-500 mt-1">
                        Click to {signatureImage ? "change" : "upload new signature"}
                      </span>
                    )}
                  </div>
                ) : (
                  <div className={`w-full h-full flex flex-col items-center justify-center p-4 ${
                    hasExistingSignature ? 'text-gray-400' : 'text-gray-400 group-hover:text-blue-500'
                  }`}>
                    <Upload className={`w-12 h-12 md:w-16 md:h-16 mb-3 ${hasExistingSignature ? 'opacity-50' : ''}`} />
                    <span className="text-base text-center font-medium">
                      {hasExistingSignature ? "Signature Already Uploaded" : "Upload Signature"}
                    </span>
                    <span className={`text-sm mt-1 text-center ${hasExistingSignature ? 'text-amber-600' : 'text-gray-500'}`}>
                      {hasExistingSignature 
                        ? "Please contact support to change your signature" 
                        : "PNG with transparent background"
                      }
                    </span>
                  </div>
                )}
              </button>
              
              {signatureImage && !hasExistingSignature && (
                <div className="mt-4 flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={uploadSignature}
                    disabled={isUploadingSignature}
                    className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isUploadingSignature ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-5 h-5" />
                        Upload Signature
                      </>
                    )}
                  </button>
                  
                  <button
                    onClick={() => clearImageSelection('signature')}
                    className="flex-1 px-4 py-2.5 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors flex items-center justify-center gap-2"
                  >
                    <X className="w-5 h-5" />
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Profile Image Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-medium text-gray-900">
                Profile Image
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                PNG format with transparent background • Max 5MB • <span className="font-medium text-blue-600">1:1 Square aspect ratio required</span>
                {hasExistingProfile && (
                  <span className="text-amber-600 font-medium ml-2">
                    • Already uploaded (Contact support to change)
                  </span>
                )}
              </p>
            </div>
            
            {profileImage && !hasExistingProfile && (
              <button
                onClick={() => clearImageSelection('profile')}
                className="px-3 py-1.5 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300 transition-colors flex items-center gap-2"
              >
                <X className="w-3 h-3" />
                Clear Selection
              </button>
            )}
          </div>
          
          <div className="flex flex-col items-center">
            <input
              type="file"
              ref={profileInputRef}
              className="hidden"
              accept=".png,image/png"
              onChange={(e) => handleImageSelect('profile', e)}
              disabled={hasExistingProfile}
            />
            
            <div className="w-full max-w-md">
              <div className="flex flex-col items-center gap-6">
                <button
                  type="button"
                  onClick={() => handleUploadClick('profile')}
                  disabled={hasExistingProfile || isValidatingImage}
                  className={`relative w-48 h-48 rounded-full border-2 border-dashed overflow-hidden group ${
                    hasExistingProfile 
                      ? 'border-gray-200 bg-gray-100 cursor-not-allowed' 
                      : isValidatingImage
                      ? 'border-blue-300 bg-blue-50 cursor-wait'
                      : 'border-gray-300 hover:border-blue-500 bg-gray-50'
                  }`}
                >
                  {isValidatingImage && (
                    <div className="absolute inset-0 bg-blue-50/80 flex items-center justify-center z-10">
                      <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                    </div>
                  )}
                  
                  {profilePreview ? (
                    <div className="w-full h-full flex items-center justify-center">
                      <img 
                        src={profilePreview} 
                        alt="Profile" 
                        className="w-full h-full object-cover rounded-full"
                        onError={(e) => {
                          e.target.src = `https://ui-avatars.com/api/?name=${user?.username || 'User'}&background=random`;
                        }}
                      />
                    </div>
                  ) : (
                    <div className={`w-full h-full flex flex-col items-center justify-center p-4 ${
                      hasExistingProfile ? 'text-gray-400' : 'text-gray-400 group-hover:text-blue-500'
                    }`}>
                      <Camera className={`w-12 h-12 md:w-16 md:h-16 mb-3 ${hasExistingProfile ? 'opacity-50' : ''}`} />
                      <span className="text-sm text-center">
                        {hasExistingProfile ? "Profile Already Uploaded" : "Upload Profile"}
                      </span>
                    </div>
                  )}
                </button>
                
                {/* 1:1 Aspect Ratio Requirement Notice */}
                {!hasExistingProfile && !profileImage && (
                  <div className="w-full bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                    <p className="text-sm text-blue-700 font-medium mb-1">📐 1:1 Square Image Required</p>
                    <p className="text-xs text-blue-600">
                      Please upload a square image with equal width and height (1:1 aspect ratio) for best results
                    </p>
                  </div>
                )}
                
                {profileImage && !hasExistingProfile && (
                  <div className="w-full flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={uploadProfileImage}
                      disabled={isUploadingProfile || isValidatingImage}
                      className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isUploadingProfile ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Uploading...
                        </>
                      ) : isValidatingImage ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Validating...
                        </>
                      ) : (
                        <>
                          <Upload className="w-5 h-5" />
                          Upload Profile Image
                        </>
                      )}
                    </button>
                    
                    <button
                      onClick={() => clearImageSelection('profile')}
                      disabled={isValidatingImage}
                      className="flex-1 px-4 py-2.5 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <X className="w-5 h-5" />
                      Cancel
                    </button>
                  </div>
                )}

                {hasExistingProfile && (
                  <div className="text-center text-amber-600 text-sm bg-amber-50 px-4 py-2 rounded-lg">
                    Profile image already uploaded. Please contact support to change.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}