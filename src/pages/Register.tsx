import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate, Link } from 'react-router-dom'
import { Eye, EyeOff, Wallet, CheckCircle2, XCircle } from 'lucide-react'
import { Button } from '../components/common/Button'
import { Input } from '../components/common/Input'
import { Card } from '../components/common/Card'
import { registerSchema, RegisterFormData, calculatePasswordStrength } from '../utils/validators'
import { AuthService } from '../services/auth.service'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'

export default function Register() {
  const navigate = useNavigate()
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const hasHydrated = useAuthStore((state) => state._hasHydrated)
  const setAuth = useAuthStore((state) => state.setAuth)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (hasHydrated && isAuthenticated) {
      navigate('/dash', { replace: true })
    }
  }, [hasHydrated, isAuthenticated, navigate])

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  })

  const password = watch('password', '')
  const passwordStrength = password ? calculatePasswordStrength(password) : null

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setIsLoading(true)
      const { confirmPassword, termsAccepted, ...registerData } = data
      const response = await AuthService.register(registerData)
      
      setAuth({
        user: {
          userId: response.user.id,
          email: response.user.email,
          fullName: response.user.fullName,
        },
        accessToken: response.token,
        refreshToken: response.refreshToken,
      })
      
      // Ensure hydration flag is set for initial registration
      useAuthStore.getState().setHasHydrated(true)
      
      toast.success('Account created successfully!')
      
      // Use replace to avoid back button issues
      navigate('/dash', { replace: true })
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to create account'
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  const getStrengthColor = (strength: 'weak' | 'medium' | 'strong') => {
    switch (strength) {
      case 'weak': return 'bg-red-500'
      case 'medium': return 'bg-yellow-500'
      case 'strong': return 'bg-green-500'
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 px-4 py-8">
      <Card className="w-full max-w-md" variant="elevated">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
            <Wallet className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Create Account
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Start managing your investments today
          </p>
        </div>

        {/* Registration Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Full Name"
            type="text"
            placeholder="John Doe"
            error={errors.fullName?.message}
            required
            {...register('fullName')}
          />

          <Input
            label="Email"
            type="email"
            placeholder="you@example.com"
            error={errors.email?.message}
            required
            {...register('email')}
          />

          <Input
            label="Phone"
            type="tel"
            placeholder="+91 1234567890 (optional)"
            error={errors.phone?.message}
            {...register('phone')}
          />

          <div className="relative">
            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Create a strong password"
              error={errors.password?.message}
              required
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-9 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          {/* Password Strength Indicator */}
          {password && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${getStrengthColor(passwordStrength!)}`}
                    style={{
                      width: passwordStrength === 'weak' ? '33%' : passwordStrength === 'medium' ? '66%' : '100%'
                    }}
                  />
                </div>
                <span className="text-xs text-gray-600 dark:text-gray-400 capitalize">
                  {passwordStrength}
                </span>
              </div>
            </div>
          )}

          <div className="relative">
            <Input
              label="Confirm Password"
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Confirm your password"
              error={errors.confirmPassword?.message}
              required
              {...register('confirmPassword')}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-9 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          {/* Terms and Conditions */}
          <div>
            <label className="flex items-start">
              <input
                type="checkbox"
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mt-1"
                {...register('termsAccepted')}
              />
              <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                I agree to the{' '}
                <Link to="/terms" className="text-blue-600 hover:text-blue-700 dark:text-blue-400">
                  Terms & Conditions
                </Link>
              </span>
            </label>
            {errors.termsAccepted && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.termsAccepted.message}</p>
            )}
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            isLoading={isLoading}
          >
            Create Account
          </Button>
        </form>

        {/* Sign In Link */}
        <div className="mt-6 text-center">
          <p className="text-gray-600 dark:text-gray-400">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium">
              Sign In
            </Link>
          </p>
        </div>
      </Card>
    </div>
  )
}
