// pages/Profile.jsx or components/Profile.jsx
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { toastSuccess, toastError } from "@/lib/toast";
import api from "@/lib/api";
import { currencyOptions } from "@/lib/helper";

const Profile = () => {
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [profileData, setProfileData] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { isDirty, isSubmitting },
  } = useForm({ mode: "onChange" });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { result } = await api.get("/user/profile");
        setProfileData(result);
        reset({
          name: result.name || "",
          phone: result.phone || "",
          age: result.age || "",
          profession: result.profession || "",
          currency: result.currency || "USD",
          monthlyGoal: result.monthlyGoal || 0,
          bio: result.bio || "",
          theme: result.theme || "system",
          notifications: result.notifications ?? true,
        });
      } catch (err) {
        toastError("Failed to load profile", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [reset]);

  const onSubmit = async (data) => {
    console.log(data);
    try {
      await api.patch("/user/profile", {
        name: data.name.trim(),
        age: data.age ? Number(data.age) : undefined,
        phone: data.phone?.trim(),
        profession: data.profession?.trim(),
        currency: data.currency,
        monthlyGoal: data.monthlyGoal ? Number(data.monthlyGoal) : undefined,
        bio: data.bio?.trim(),
        theme: data.theme,
        notifications: data.notifications,
      });
      toastSuccess("Profile updated successfully!");
      reset({
        name: data.name.trim(),
        age: data.age ? Number(data.age) : undefined,
        phone: data.phone?.trim(),
        profession: data.profession?.trim(),
        currency: data.currency,
        monthlyGoal: data.monthlyGoal ? Number(data.monthlyGoal) : undefined,
        bio: data.bio?.trim(),
        theme: data.theme,
        notifications: data.notifications,
      });
    } catch (err) {
      toastError(err?.response?.data?.message || "Failed to update profile");
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("avatar", file);

      const res = await api.post("/user/profile/avatar", formData);

      setProfileData((p) => ({ ...p, avatar: res.result.avatar }));
      toastSuccess("Avatar updated!");
    } catch (err) {
      console.error("Avatar upload error:", err);
      toastError(err?.response?.data?.message || "Failed to upload avatar");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  const avatarUrl =
    profileData?.avatar ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      profileData?.name || "User",
    )}&background=6366f1&color=fff&bold=true`;

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* <h1 className="text-3xl font-bold mb-8 text-center">Profile Settings</h1> */}

      <div className="card bg-base-100 shadow-2xl">
        <div className="card-body space-y-8">
          {/* Avatar */}
          <div className="flex flex-col items-center sm:flex-row gap-6">
            <div className="avatar">
              <div className="w-32 rounded-full ring ring-primary ring-offset-base-100 ring-offset-4">
                <img src={avatarUrl} alt="Profile" className="object-cover" />
              </div>
            </div>
            <div className="text-center sm:text-left">
              <label
                className={`btn btn-primary ${uploading ? "loading" : ""}`}
              >
                {uploading ? "Uploading..." : "Change Photo"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                  disabled={uploading}
                />
              </label>
              <p className="text-sm text-base-content/60 mt-2">
                JPG, PNG up to 5MB
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="form-control">
                <label className="label w-full mb-1">
                  <span className="label-text font-medium">Name</span>
                </label>
                <input
                  {...register("name")}
                  className="input input-bordered"
                  placeholder="John Doe"
                />
              </div>

              <div className="form-control">
                <label className="label w-full mb-1">
                  <span className="label-text font-medium">Email</span>
                </label>
                <input
                  value={profileData?.email || ""}
                  disabled
                  className="input input-bordered input-disabled"
                />
              </div>

              <div className="form-control">
                <label className="label w-full mb-1">
                  <span className="label-text font-medium">Phone</span>
                </label>
                <input
                  {...register("phone")}
                  type="tel"
                  className="input input-bordered"
                />
              </div>

              <div className="form-control">
                <label className="label w-full mb-1">
                  <span className="label-text font-medium">Age</span>
                </label>
                <input
                  {...register("age")}
                  type="number"
                  min="13"
                  max="120"
                  className="input input-bordered"
                  placeholder="25"
                />
              </div>

              <div className="form-control">
                <label className="label w-full mb-1">
                  <span className="label-text font-medium">Profession</span>
                </label>
                <input
                  {...register("profession")}
                  className="input input-bordered"
                  placeholder="Software Engineer"
                />
              </div>

              <div className="form-control">
                <label className="label w-full mb-1">
                  <span className="label-text font-medium">Currency</span>
                </label>
                <select
                  {...register("currency")}
                  className="select select-bordered"
                >
                  {currencyOptions.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-control">
                <label className="label w-full mb-1">
                  <span className="label-text font-medium">Monthly Goal</span>
                </label>
                <input
                  {...register("monthlyGoal")}
                  type="number"
                  min="0"
                  className="input input-bordered"
                  placeholder="1000"
                />
              </div>

              <div className="form-control">
                <label className="label w-full mb-1">
                  <span className="label-text font-medium">Theme</span>
                </label>
                <select
                  {...register("theme")}
                  className="select select-bordered"
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="system">System</option>
                </select>
              </div>
            </div>

            <div className="form-control">
              <label className="label w-full mb-1">
                <span className="label-text font-medium">Bio</span>
                <span className="label-text-alt">
                  {watch("bio")?.length || 0}/160
                </span>
              </label>
              <textarea
                {...register("bio")}
                className="textarea textarea-bordered h-28 resize-none"
                placeholder="Tell us about yourself..."
                maxLength={160}
              />
            </div>

            <div className="form-control">
              <label className="cursor-pointer label justify-start gap-4">
                <input
                  {...register("notifications")}
                  type="checkbox"
                  checked={watch("notifications")}
                  className="toggle toggle-primary"
                />
                <span className="label-text">Email Notifications</span>
              </label>
            </div>

            <div className="card-actions justify-end pt-6">
              <button
                type="submit"
                disabled={!isDirty || isSubmitting}
                className="btn btn-primary btn-wide"
              >
                {isSubmitting ? (
                  <span className="loading loading-spinner"></span>
                ) : isDirty ? (
                  "Save Changes"
                ) : (
                  "No Changes"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
