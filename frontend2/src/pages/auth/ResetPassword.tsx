import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useResetPassword } from "@/api/auth";
import { resetPasswordSchema, type ResetPasswordValues } from "@/lib/schemas";
import { toastError } from "@/lib/api";

export default function ResetPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const rp = useResetPassword();
  const token = params.get("token") ?? "";

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { token, password: "", confirm: "" },
  });

  const onSubmit = async (vals: ResetPasswordValues) => {
    try {
      await rp.mutateAsync({ token: vals.token, password: vals.password });
      toast.success("Password reset. Please sign in.");
      navigate("/login");
    } catch (e) {
      toastError(e);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Reset password</CardTitle>
        <CardDescription>Enter your new password.</CardDescription>
      </CardHeader>
      <CardContent>
        {!token && (
          <p className="text-sm text-destructive mb-3">
            Missing reset token. Use the link from your email.
          </p>
        )}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <input type="hidden" {...register("token")} />
          <div className="space-y-2">
            <Label htmlFor="password">New password</Label>
            <Input id="password" type="password" {...register("password")} />
            {errors.password && (
              <p className="text-xs text-destructive">{errors.password.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm">Confirm password</Label>
            <Input id="confirm" type="password" {...register("confirm")} />
            {errors.confirm && (
              <p className="text-xs text-destructive">{errors.confirm.message}</p>
            )}
          </div>
          <Button type="submit" className="w-full" disabled={rp.isPending || !token}>
            {rp.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Reset password
          </Button>
          <p className="text-center text-sm">
            <Link to="/login" className="text-primary hover:underline">
              Back to sign in
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
