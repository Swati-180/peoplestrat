import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mail, Lock, User, Building, Sparkles } from "lucide-react";

import { FormField } from "@/components/FormField.jsx";

export default function Register() {
  const [, setLocation] = useLocation();
  const { register, user } = useAuth();
  const { toast } = useToast();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [department, setDepartment] = useState("");
  const [role, setRole] = useState("employee");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [touched, setTouched] = useState({});

  const validateEmail = (email) => {
    return String(email)
      .toLowerCase()
      .match(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
      );
  };

  const getErrors = () => {
    const errors = {};
    if (username.length < 3) errors.username = "Username must be at least 3 characters";
    if (!validateEmail(email)) errors.email = "Invalid email address";
    if (password.length < 6) errors.password = "Password must be at least 6 characters";
    if (!/[A-Z]/.test(password)) errors.password = "Password must contain at least one uppercase letter";
    return errors;
  };

  const formErrors = getErrors();

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setTouched({ username: true, email: true, password: true, department: true });
    
    if (Object.keys(formErrors).length > 0) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors in the form.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      await register(username, email, password, department, role);
      toast({
        title: "Success",
        description: "Account created successfully",
      });
      setLocation("/");
    } catch (err) {
      setError(err.message || "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  // Redirect if already logged in
  React.useEffect(() => {
    if (user) {
      setLocation("/", { replace: true });
    }
  }, [user, setLocation]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-950 dark:to-indigo-950">
      <Card className="w-full max-w-md shadow-2xl border-0 overflow-hidden">
        <div className="h-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
        <CardHeader className="text-center space-y-4 pb-8">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
              Create Your Account
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-2 font-medium">
              Join AI Workforce Optimization Platform
            </p>
          </div>
        </CardHeader>

        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-6 animate-in fade-in zoom-in duration-300">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleRegister} className="space-y-6">
            <FormField
              label="Username"
              required
              touched={touched.username}
              error={formErrors.username}
              success={!formErrors.username ? "Username is valid" : ""}
            >
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground z-10" />
                <Input
                  id="username"
                  type="text"
                  placeholder="johndoe"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onBlur={() => handleBlur("username")}
                  className="pl-10 h-11"
                  data-testid="input-username"
                />
              </div>
            </FormField>

            <FormField
              label="Email"
              required
              touched={touched.email}
              error={formErrors.email}
              success={!formErrors.email ? "Email is valid" : ""}
            >
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground z-10" />
                <Input
                  id="email"
                  type="email"
                  placeholder="john@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => handleBlur("email")}
                  className="pl-10 h-11"
                  data-testid="input-email"
                />
              </div>
            </FormField>

            <FormField
              label="Password"
              required
              touched={touched.password}
              error={formErrors.password}
              success={!formErrors.password ? "Password strength: strong" : ""}
            >
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground z-10" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Create a strong password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => handleBlur("password")}
                  className="pl-10 h-11"
                  data-testid="input-password"
                />
              </div>
            </FormField>

            <FormField
              label="Department"
              touched={touched.department}
            >
              <div className="relative">
                <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground z-10" />
                <Input
                  id="department"
                  type="text"
                  placeholder="Engineering, HR, Finance, etc."
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  onBlur={() => handleBlur("department")}
                  className="pl-10 h-11"
                  data-testid="input-department"
                />
              </div>
            </FormField>


            <div className="space-y-2">
              <Label htmlFor="role" className="text-sm font-medium">Role</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger id="role" data-testid="select-role">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="employee" data-testid="option-role-employee">Employee</SelectItem>
                  <SelectItem value="manager" data-testid="option-role-admin">Manager</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
              disabled={isLoading}
              data-testid="button-register"
            >
              {isLoading ? "Creating account..." : "Create Account"}
            </Button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-background text-muted-foreground">
                  Already have an account?
                </span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => setLocation("/login")}
              data-testid="button-login"
            >
              Sign In
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
