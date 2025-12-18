"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Navigation } from "@/components/navigation";
import { showToast } from "@/lib/toast";
import { Loader2, Settings, Shield, Mail, Check, X, AlertCircle, Key, Eye, EyeOff, Download } from "lucide-react";

interface UserData {
    id: string;
    email: string;
    name: string;
    twoFactorEnabled?: boolean;
}

export default function SettingsPage() {
    const router = useRouter();
    const [user, setUser] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(true);
    const [twoFALoading, setTwoFALoading] = useState(false);
    const [emailLoading, setEmailLoading] = useState(false);
    const [passwordLoading, setPasswordLoading] = useState(false);

    // 2FA states
    const [twoFAEnabled, setTwoFAEnabled] = useState(false);
    const [twoFAVerifying, setTwoFAVerifying] = useState(false);
    const [twoFACode, setTwoFACode] = useState("");

    // Email change states
    const [newEmail, setNewEmail] = useState("");
    const [emailVerifying, setEmailVerifying] = useState(false);
    const [emailCode, setEmailCode] = useState("");
    const [pendingEmail, setPendingEmail] = useState("");

    // Password change states
    const [passwordData, setPasswordData] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // PWA Install states
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [showInstallButton, setShowInstallButton] = useState(false);

    // PWA Install handler
    useEffect(() => {
        // Register service worker
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker
                    .register('/sw.js')
                    .then((registration) => {
                        console.log('Service Worker registered:', registration);
                        
                        // Check for updates
                        registration.addEventListener('updatefound', () => {
                            const newWorker = registration.installing;
                            if (newWorker) {
                                newWorker.addEventListener('statechange', () => {
                                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                        // New service worker available
                                        if (confirm('New version available! Reload to update?')) {
                                            window.location.reload();
                                        }
                                    }
                                });
                            }
                        });
                    })
                    .catch((error) => {
                        console.error('Service Worker registration failed:', error);
                    });
            });
        }

        // Handle PWA install prompt
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setShowInstallButton(true);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        // Check if app is already installed
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setShowInstallButton(false);
        }

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;

        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
            showToast.success("App installing", "The app is being installed");
        } else {
            showToast.error("Install cancelled", "App installation was cancelled");
        }
        
        setDeferredPrompt(null);
        setShowInstallButton(false);
    };

    const fetchUser = useCallback(async () => {
        try {
            const response = await fetch("/api/auth/me");
            const result = await response.json();
            if (result.success) {
                setUser(result.data.user);
                setTwoFAEnabled(result.data.user.twoFactorEnabled || false);
            } else {
                router.push("/signin");
            }
        } catch (error) {
            console.error("Error fetching user:", error);
            router.push("/signin");
        } finally {
            setLoading(false);
        }
    }, [router]);

    useEffect(() => {
        fetchUser();
    }, [fetchUser]);

    const handleEnable2FA = async () => {
        setTwoFALoading(true);

        try {
            const response = await fetch("/api/auth/2fa/enable", {
                method: "POST",
            });

            const result = await response.json();

            if (result.success) {
                setTwoFAVerifying(true);
                showToast.success("Code sent", "Verification code sent to your email");
            } else {
                showToast.error("Failed", result.error || "Failed to enable 2FA");
            }
        } catch (error) {
            console.error("Error enabling 2FA:", error);
            showToast.error("Error", "Error enabling 2FA. Please try again.");
        } finally {
            setTwoFALoading(false);
        }
    };

    const handleVerify2FA = async () => {
        if (!twoFACode || twoFACode.length !== 6) {
            showToast.error("Validation error", "Please enter a valid 6-digit code");
            return;
        }

        setTwoFALoading(true);

        try {
            const response = await fetch("/api/auth/2fa/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code: twoFACode }),
            });

            const result = await response.json();

            if (result.success) {
                setTwoFAEnabled(true);
                setTwoFAVerifying(false);
                setTwoFACode("");
                showToast.success("2FA enabled", "Two-factor authentication enabled successfully");
                await fetchUser();
            } else {
                showToast.error("Verification failed", result.error || "Invalid verification code");
            }
        } catch (error) {
            console.error("Error verifying 2FA:", error);
            showToast.error("Error", "Error verifying code. Please try again.");
        } finally {
            setTwoFALoading(false);
        }
    };

    const handleDisable2FA = async () => {
        if (!confirm("Are you sure you want to disable two-factor authentication? This will make your account less secure.")) {
            return;
        }

        setTwoFALoading(true);

        try {
            const response = await fetch("/api/auth/2fa/disable", {
                method: "POST",
            });

            const result = await response.json();

            if (result.success) {
                setTwoFAEnabled(false);
                showToast.success("2FA disabled", "Two-factor authentication disabled successfully");
                await fetchUser();
            } else {
                showToast.error("Failed", result.error || "Failed to disable 2FA");
            }
        } catch (error) {
            console.error("Error disabling 2FA:", error);
            showToast.error("Error", "Error disabling 2FA. Please try again.");
        } finally {
            setTwoFALoading(false);
        }
    };

    const handleChangeEmail = async () => {
        if (!newEmail) {
            showToast.error("Validation error", "Please enter a new email address");
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(newEmail)) {
            showToast.error("Validation error", "Please enter a valid email address");
            return;
        }

        setEmailLoading(true);

        try {
            const response = await fetch("/api/auth/change-email", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ newEmail }),
            });

            const result = await response.json();

            if (result.success) {
                setPendingEmail(result.pendingEmail);
                setEmailVerifying(true);
                showToast.success("Code sent", "Verification code sent to your new email address");
            } else {
                showToast.error("Failed", result.error || "Failed to initiate email change");
            }
        } catch (error) {
            console.error("Error changing email:", error);
            showToast.error("Error", "Error changing email. Please try again.");
        } finally {
            setEmailLoading(false);
        }
    };

    const handleVerifyEmail = async () => {
        if (!emailCode || emailCode.length !== 6) {
            showToast.error("Validation error", "Please enter a valid 6-digit code");
            return;
        }

        setEmailLoading(true);

        try {
            const response = await fetch("/api/auth/change-email", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code: emailCode, newEmail: pendingEmail }),
            });

            const result = await response.json();

            if (result.success) {
                setEmailVerifying(false);
                setEmailCode("");
                setNewEmail("");
                setPendingEmail("");
                showToast.success("Email changed", "Email changed successfully");
                await fetchUser();
            } else {
                showToast.error("Verification failed", result.error || "Invalid verification code");
            }
        } catch (error) {
            console.error("Error verifying email:", error);
            showToast.error("Error", "Error verifying code. Please try again.");
        } finally {
            setEmailLoading(false);
        }
    };

    const handleChangePassword = async () => {
        if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
            showToast.error("Validation error", "All password fields are required");
            return;
        }

        if (passwordData.newPassword.length < 6) {
            showToast.error("Validation error", "New password must be at least 6 characters long");
            return;
        }

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            showToast.error("Validation error", "New passwords do not match");
            return;
        }

        setPasswordLoading(true);

        try {
            const response = await fetch("/api/auth/change-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    currentPassword: passwordData.currentPassword,
                    newPassword: passwordData.newPassword,
                }),
            });

            const result = await response.json();

            if (result.success) {
                showToast.success("Password changed", "Password changed successfully");
                setPasswordData({
                    currentPassword: "",
                    newPassword: "",
                    confirmPassword: "",
                });
            } else {
                showToast.error("Failed", result.error || "Error changing password");
            }
        } catch (error) {
            console.error("Error changing password:", error);
            showToast.error("Error", "Error changing password. Please try again.");
        } finally {
            setPasswordLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
                <Navigation />
                <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-8">
                    <div className="space-y-6">
                        <div className="h-10 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                        <div className="grid gap-6 lg:grid-cols-2">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="h-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
            <Navigation />
            <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="max-w-5xl mx-auto"
                >
                    {/* Header */}
                    <div className="mb-8">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-3 rounded-full bg-primary/10">
                                <Settings className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100">Settings</h1>
                            </div>
                        </div>
                        <p className="text-muted-foreground ml-14">Manage your account settings and security</p>
                    </div>

                    {/* Settings Grid */}
                    <div className="grid gap-6 lg:grid-cols-2">

                        {/* Two-Factor Authentication */}
                        <Card className="shadow-lg border-0 bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl h-fit">
                            <CardHeader className="pb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-primary/10">
                                        <Shield className="h-5 w-5 text-primary" />
                                    </div>
                                    <div className="flex-1">
                                        <CardTitle className="text-lg text-gray-900 dark:text-gray-100">Two-Factor Authentication</CardTitle>
                                        <CardDescription className="text-xs mt-1">
                                            Add an extra layer of security
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                                    <div className="flex-1">
                                        <p className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                                            Status: <span className={twoFAEnabled ? "text-green-600 dark:text-green-400" : "text-gray-500"}>{twoFAEnabled ? "Enabled" : "Disabled"}</span>
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            {twoFAEnabled
                                                ? "Your account is protected with 2FA"
                                                : "Enable 2FA to secure your account"}
                                        </p>
                                    </div>
                                    {twoFAEnabled ? (
                                        <Button
                                            onClick={handleDisable2FA}
                                            disabled={twoFALoading}
                                            variant="outline"
                                            size="sm"
                                            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 whitespace-nowrap"
                                            aria-label="Disable two-factor authentication"
                                        >
                                            {twoFALoading ? (
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            ) : null}
                                            Disable
                                        </Button>
                                    ) : (
                                        <Button
                                            onClick={handleEnable2FA}
                                            disabled={twoFALoading}
                                            size="sm"
                                            className="whitespace-nowrap"
                                            aria-label="Enable two-factor authentication"
                                        >
                                            {twoFALoading ? (
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            ) : null}
                                            Enable
                                        </Button>
                                    )}
                                </div>

                                {twoFAVerifying && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        className="space-y-3 p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800"
                                    >
                                        <p className="text-sm font-medium text-blue-900 dark:text-blue-300">
                                            Enter the verification code sent to your email
                                        </p>
                                        <Input
                                            type="text"
                                            placeholder="Enter 6-digit code"
                                            value={twoFACode}
                                            onChange={(e) => setTwoFACode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                                            className="text-center text-xl sm:text-2xl tracking-widest font-mono"
                                            maxLength={6}
                                            autoFocus
                                            aria-label="Two-factor authentication verification code"
                                        />
                                        <div className="flex gap-2">
                                            <Button
                                                onClick={handleVerify2FA}
                                                disabled={twoFALoading || twoFACode.length !== 6}
                                                className="flex-1"
                                                aria-label="Verify two-factor authentication code"
                                            >
                                                {twoFALoading ? (
                                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                ) : (
                                                    <Check className="h-4 w-4 mr-2" />
                                                )}
                                                Verify
                                            </Button>
                                            <Button
                                                onClick={() => {
                                                    setTwoFAVerifying(false);
                                                    setTwoFACode("");
                                                }}
                                                variant="outline"
                                                aria-label="Cancel two-factor authentication setup"
                                            >
                                                <X className="h-4 w-4 mr-2" />
                                                Cancel
                                            </Button>
                                        </div>
                                    </motion.div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Email Change */}
                        <Card className="shadow-lg border-0 bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl h-fit">
                            <CardHeader className="pb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-primary/10">
                                        <Mail className="h-5 w-5 text-primary" />
                                    </div>
                                    <div className="flex-1">
                                        <CardTitle className="text-lg text-gray-900 dark:text-gray-100">Change Email</CardTitle>
                                        <CardDescription className="text-xs mt-1">
                                            Update your email address
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                                    <p className="text-xs text-muted-foreground mb-1">Current Email</p>
                                    <p className="font-medium text-sm text-gray-900 dark:text-gray-100 break-all">{user?.email}</p>
                                </div>

                                {!emailVerifying ? (
                                    <div className="space-y-3">
                                        <div>
                                            <label htmlFor="newEmail" className="text-sm font-medium mb-2 block">
                                                New Email
                                            </label>
                                            <Input
                                                id="newEmail"
                                                type="email"
                                                placeholder="new@example.com"
                                                value={newEmail}
                                                onChange={(e) => setNewEmail(e.target.value)}
                                                className="h-10"
                                                aria-label="New email address"
                                            />
                                        </div>
                                        <Button
                                            onClick={handleChangeEmail}
                                            disabled={emailLoading || !newEmail}
                                            className="w-full"
                                            aria-label="Send email verification code"
                                        >
                                            {emailLoading ? (
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            ) : (
                                                <Mail className="h-4 w-4 mr-2" />
                                            )}
                                            Send Verification Code
                                        </Button>
                                    </div>
                                ) : (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        className="space-y-3 p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800"
                                    >
                                        <p className="text-sm font-medium text-blue-900 dark:text-blue-300">
                                            Enter the verification code sent to <span className="font-mono text-xs break-all">{pendingEmail}</span>
                                        </p>
                                        <Input
                                            type="text"
                                            placeholder="Enter 6-digit code"
                                            value={emailCode}
                                            onChange={(e) => setEmailCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                                            className="text-center text-xl sm:text-2xl tracking-widest font-mono"
                                            maxLength={6}
                                            autoFocus
                                            aria-label="Email verification code"
                                        />
                                        <div className="flex gap-2">
                                            <Button
                                                onClick={handleVerifyEmail}
                                                disabled={emailLoading || emailCode.length !== 6}
                                                className="flex-1"
                                                aria-label="Verify email change code"
                                            >
                                                {emailLoading ? (
                                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                ) : (
                                                    <Check className="h-4 w-4 mr-2" />
                                                )}
                                                Verify
                                            </Button>
                                            <Button
                                                onClick={() => {
                                                    setEmailVerifying(false);
                                                    setEmailCode("");
                                                    setPendingEmail("");
                                                    setNewEmail("");
                                                }}
                                                variant="outline"
                                                aria-label="Cancel email change"
                                            >
                                                <X className="h-4 w-4 mr-2" />
                                                Cancel
                                            </Button>
                                        </div>
                                    </motion.div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Change Password */}
                        <Card className="shadow-lg border-0 bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl lg:col-span-2">
                            <CardHeader className="pb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-primary/10">
                                        <Key className="h-5 w-5 text-primary" />
                                    </div>
                                    <div className="flex-1">
                                        <CardTitle className="text-lg text-gray-900 dark:text-gray-100">Change Password</CardTitle>
                                        <CardDescription className="text-xs mt-1">
                                            Update your account password
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="grid gap-4 sm:grid-cols-3">
                                    <div>
                                        <label htmlFor="currentPassword" className="text-sm font-medium mb-2 block">
                                            Current Password
                                        </label>
                                        <div className="relative">
                                            <Input
                                                id="currentPassword"
                                                type={showCurrentPassword ? "text" : "password"}
                                                placeholder="Current password"
                                                value={passwordData.currentPassword}
                                                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                                className="h-10 pr-10"
                                                aria-label="Current password"
                                                aria-required="true"
                                            />
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="absolute right-0 top-0 h-10 w-10"
                                                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                                aria-label={showCurrentPassword ? "Hide password" : "Show password"}
                                            >
                                                {showCurrentPassword ? (
                                                    <EyeOff className="h-4 w-4" />
                                                ) : (
                                                    <Eye className="h-4 w-4" />
                                                )}
                                            </Button>
                                        </div>
                                    </div>

                                    <div>
                                        <label htmlFor="newPassword" className="text-sm font-medium mb-2 block">
                                            New Password
                                        </label>
                                        <div className="relative">
                                            <Input
                                                id="newPassword"
                                                type={showNewPassword ? "text" : "password"}
                                                placeholder="New password"
                                                value={passwordData.newPassword}
                                                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                                className="h-10 pr-10"
                                                minLength={6}
                                                aria-label="New password"
                                                aria-required="true"
                                                aria-describedby="password-help"
                                            />
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="absolute right-0 top-0 h-10 w-10"
                                                onClick={() => setShowNewPassword(!showNewPassword)}
                                                aria-label={showNewPassword ? "Hide password" : "Show password"}
                                            >
                                                {showNewPassword ? (
                                                    <EyeOff className="h-4 w-4" />
                                                ) : (
                                                    <Eye className="h-4 w-4" />
                                                )}
                                            </Button>
                                        </div>
                                        <p id="password-help" className="text-xs text-muted-foreground mt-1">
                                            Min. 6 characters
                                        </p>
                                    </div>

                                    <div>
                                        <label htmlFor="confirmPassword" className="text-sm font-medium mb-2 block">
                                            Confirm Password
                                        </label>
                                        <div className="relative">
                                            <Input
                                                id="confirmPassword"
                                                type={showConfirmPassword ? "text" : "password"}
                                                placeholder="Confirm password"
                                                value={passwordData.confirmPassword}
                                                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                                className="h-10 pr-10"
                                                minLength={6}
                                                aria-label="Confirm new password"
                                                aria-required="true"
                                            />
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="absolute right-0 top-0 h-10 w-10"
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                                            >
                                                {showConfirmPassword ? (
                                                    <EyeOff className="h-4 w-4" />
                                                ) : (
                                                    <Eye className="h-4 w-4" />
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                    <Button
                                        onClick={handleChangePassword}
                                        disabled={passwordLoading || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                                        className="w-full sm:w-auto"
                                        aria-label="Change password"
                                    >
                                        {passwordLoading ? (
                                            <>
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                Changing Password...
                                            </>
                                        ) : (
                                            <>
                                                <Key className="h-4 w-4 mr-2" />
                                                Change Password
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Install App */}
                        <Card className="shadow-lg border-0 bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl h-fit">
                            <CardHeader className="pb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-primary/10">
                                        <Download className="h-5 w-5 text-primary" />
                                    </div>
                                    <div className="flex-1">
                                        <CardTitle className="text-lg text-gray-900 dark:text-gray-100">Install App</CardTitle>
                                        <CardDescription className="text-xs mt-1">
                                            Install this app on your device
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                                    <div className="flex-1">
                                        <p className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                                            {showInstallButton ? "Available for Installation" : window.matchMedia('(display-mode: standalone)').matches ? "App Installed" : "Not Available"}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            {showInstallButton
                                                ? "Install this app on your device for a better experience"
                                                : window.matchMedia('(display-mode: standalone)').matches
                                                ? "This app is already installed on your device"
                                                : "Install prompt is not available. The app may already be installed or your browser doesn't support PWA installation."}
                                        </p>
                                    </div>
                                </div>

                                {showInstallButton && (
                                    <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                                        <Button
                                            onClick={handleInstallClick}
                                            className="w-full sm:w-auto"
                                            aria-label="Install app"
                                        >
                                            <Download className="h-4 w-4 mr-2" />
                                            Install App
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}

