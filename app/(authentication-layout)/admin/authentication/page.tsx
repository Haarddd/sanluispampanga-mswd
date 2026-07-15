"use client";

import { useState } from "react";
import { loginAdmin } from "@/app/actions/admin-auth";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";

export default function AdminAuthenticationPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    try {
      const res = await loginAdmin(formData);
      if (res?.error) {
        toast.error(res.error);
      } else if (res?.success) {
        router.push("/admin/dashboard");
      }
    } catch (err) {
      console.error(err);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 pt-16 pb-10">
      {/* Brand Header */}
      <div className="flex flex-col items-center gap-5 mb-14">
        <div className="flex items-center gap-4">
          <Image
            src="/mswd.png"
            alt="MSWD Logo"
            width={64}
            height={64}
            className="rounded-xl object-contain"
            priority
          />
          <Image
            src="/slp.png"
            alt="SLP Logo"
            width={64}
            height={64}
            className="rounded-xl object-contain"
            priority
          />
        </div>

        <div className="text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            MSWD Admin Dashboard
          </h1>
        </div>
      </div>

      {/* Form content */}
      <div className="w-full flex flex-col gap-8">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-foreground">
            Sign In to Dashboard
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Enter your administrative credentials to continue
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="email" className="text-base font-medium">
              Email Address
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              required
              disabled={loading}
              className="pl-4 h-12 text-base md:text-base"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="password" className="text-base font-medium">
              Password
            </Label>
            <Input
              id="password"
              name="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              disabled={loading}
              className="pl-4 h-12 text-base md:text-base"
            />
          </div>

          <Button
            type="submit"
            disabled={loading || !email.trim() || !password.trim()}
            className="w-full h-12 text-base rounded-md font-medium "
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Sign In"}
          </Button>
        </form>
      </div>
    </div>
  );
}
