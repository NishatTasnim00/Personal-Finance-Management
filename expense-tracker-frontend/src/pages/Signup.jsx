import AuthLayout from "@/components/Layout/AuthLayout";
import SignupForm from "@/components/Auth/SignupForm";

const Signup = () => {
  return (
    <AuthLayout title="Create your account">
      <SignupForm />
    </AuthLayout>
  );
};
export default Signup;  