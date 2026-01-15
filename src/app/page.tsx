import { ChefHat, Users, BookMarked, ShoppingBag } from 'lucide-react'
import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <div className="bg-orange-500 rounded-full p-6">
              <ChefHat className="w-16 h-16 text-white" />
            </div>
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Virtual Recipe Box
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Your family's recipes, organized and accessible anywhere. Cook, share, and perfect your favorite dishes.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          <FeatureCard
            icon={<Users className="w-8 h-8" />}
            title="Family Sharing"
            description="Share recipes with household members and collaborate on variations"
          />
          <FeatureCard
            icon={<BookMarked className="w-8 h-8" />}
            title="Recipe Management"
            description="Store ingredients, instructions, and track cooking history"
          />
          <FeatureCard
            icon={<ShoppingBag className="w-8 h-8" />}
            title="Offline Shopping"
            description="Save recipes for offline access during grocery trips"
          />
          <FeatureCard
            icon={<ChefHat className="w-8 h-8" />}
            title="Scale Recipes"
            description="Adjust quantities with multipliers for any serving size"
          />
        </div>

        {/* CTA Section */}
        <div className="text-center bg-white rounded-2xl shadow-lg p-8 max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Ready to get cooking?
          </h2>
          <p className="text-gray-600 mb-6">
            Sign up to start organizing your recipes and cooking with your family.
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/signup"
              className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-8 py-3 rounded-lg transition-colors"
            >
              Get Started
            </Link>
            <Link
              href="/login"
              className="bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold px-8 py-3 rounded-lg transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>

        {/* Setup Notice */}
        <div className="mt-16 text-center text-sm text-gray-500">
          <p>
            <strong>Setup Required:</strong> This app needs Supabase configuration.
            <br />
            See <code className="bg-gray-100 px-2 py-1 rounded">README.md</code> for setup instructions.
          </p>
        </div>
      </div>
    </div>
  )
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-shadow">
      <div className="text-orange-500 mb-4">{icon}</div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 text-sm">{description}</p>
    </div>
  )
}
