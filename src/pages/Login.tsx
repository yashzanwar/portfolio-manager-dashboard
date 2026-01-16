import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate, Link } from 'react-router-dom'
import { Eye, EyeOff, Wallet } from 'lucide-react'
import { Button } from '../components/common/Button'
import { Input } from '../components/common/Input'
import { Card } from '../components/common/Card'
import { loginSchema, LoginFormData } from '../utils/validators'
import { AuthService } from '../services/auth.service'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'

export default function Login() {
  console.log('Login component rendering')
  const navigate = useNavigate()
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const hasHydrated = useAuthStore((state) => state._hasHydrated)
  const setAuth = useAuthStore((state) => state.setAuth)
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  console.log('Login state:', { isAuthenticated, hasHydrated })

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (hasHydrated && isAuthenticated) {
      console.log('Redirecting to dashboard - already authenticated')
      navigate('/dash', { replace: true })
    }
  }, [hasHydrated, isAuthenticated, navigate])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
    try {
      setIsLoading(true)
      
      const response = await AuthService.login(data)
      
      setAuth({
        user: {
          userId: response.user.id,
          email: response.user.email,
          fullName: response.user.fullName,
        },
        accessToken: response.token,
        refreshToken: response.refreshToken,
      })
      
      // Ensure hydration flag is set for initial login
      useAuthStore.getState().setHasHydrated(true)
      
      toast.success('Login successful!')
      
      // Use replace to avoid back button issues
      navigate('/dash', { replace: true })
    } catch (error: any) {
      const message = error.response?.data?.message || 'Invalid email or password'
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 px-4">
      <Card className="w-full max-w-md" variant="elevated">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
            <Wallet className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome Back
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Sign in to manage your portfolio
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Email"
            type="email"
            placeholder="you@example.com"
            error={errors.email?.message}
            {...register('email')}
          />

          <div className="relative">
            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              error={errors.password?.message}
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

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center">
              <input
                type="checkbox"
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-gray-600 dark:text-gray-400">Remember me</span>
            </label>
            <Link
              to="/forgot-password"
              className="text-blue-600 hover:text-blue-700 dark:text-blue-400"
            >
              Forgot password?
            </Link>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            isLoading={isLoading}
          >
            Sign In
          </Button>
        </form>

        {/* Sign Up Link */}
        <div className="mt-6 text-center">
          <p className="text-gray-600 dark:text-gray-400">
            Don't have an account?{' '}
            <Link to="/register" className="text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium">
              Sign Up
            </Link>
          </p>
        </div>
      </Card>
    </div>
  )
}
