import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Users, MessageSquare, FileText, Wallet, GraduationCap, Heart, Shield } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-orange-50 to-amber-50">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <nav className="flex justify-between items-center mb-16">
          <div className="flex items-center gap-2">
            <Heart className="w-8 h-8 text-teal-600" />
            <h1 className="text-2xl font-bold text-gray-800">CoParent</h1>
          </div>
          <div className="flex gap-4">
            <Link href="/login">
              <Button variant="outline" className="border-teal-600 text-teal-600 hover:bg-teal-50">
                Sign In
              </Button>
            </Link>
            <Link href="/register">
              <Button className="bg-teal-600 hover:bg-teal-700">
                Get Started
              </Button>
            </Link>
          </div>
        </nav>

        {/* Hero Content */}
        <div className="text-center max-w-4xl mx-auto mb-20">
          <h2 className="text-5xl font-bold text-gray-900 mb-6">
            Stress-Free Co-Parenting
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Coordinate schedules, activities, and communication with your co-parent effortlessly.
            Keep your children first with tools designed for modern co-parenting.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" className="bg-teal-600 hover:bg-teal-700 text-lg px-8 py-6">
                Start Free Trial
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="border-teal-600 text-teal-600 hover:bg-teal-50 text-lg px-8 py-6">
                Learn More
              </Button>
            </Link>
          </div>
        </div>

        {/* Features Section */}
        <div className="mb-20">
          <h3 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Everything You Need for Co-Parenting
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="border-none shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-6">
                <Calendar className="w-12 h-12 text-teal-600 mb-4" />
                <h4 className="text-xl font-semibold mb-2">Shared Calendar</h4>
                <p className="text-gray-600">
                  Sync custody schedules, activities, and appointments in real-time. Never miss an important date.
                </p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-6">
                <MessageSquare className="w-12 h-12 text-teal-600 mb-4" />
                <h4 className="text-xl font-semibold mb-2">Secure Messaging</h4>
                <p className="text-gray-600">
                  Communicate directly with your co-parent through private, organized messages.
                </p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-6">
                <Users className="w-12 h-12 text-teal-600 mb-4" />
                <h4 className="text-xl font-semibold mb-2">Activity Planning</h4>
                <p className="text-gray-600">
                  Discover and plan kid-friendly activities. Keep children engaged and happy.
                </p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-6">
                <Wallet className="w-12 h-12 text-teal-600 mb-4" />
                <h4 className="text-xl font-semibold mb-2">Expense Tracking</h4>
                <p className="text-gray-600">
                  Track shared expenses, payments, and reimbursements transparently.
                </p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-6">
                <FileText className="w-12 h-12 text-teal-600 mb-4" />
                <h4 className="text-xl font-semibold mb-2">Document Sharing</h4>
                <p className="text-gray-600">
                  Store and share important documents, medical records, and school files securely.
                </p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-6">
                <GraduationCap className="w-12 h-12 text-teal-600 mb-4" />
                <h4 className="text-xl font-semibold mb-2">Education Hub</h4>
                <p className="text-gray-600">
                  Track school tasks, reading lists, and educational progress together.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Benefits Section */}
        <div className="bg-white rounded-2xl shadow-lg p-12 mb-20">
          <h3 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Why Choose CoParent?
          </h3>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="flex gap-4">
              <Shield className="w-8 h-8 text-teal-600 flex-shrink-0 mt-1" />
              <div>
                <h4 className="text-xl font-semibold mb-2">Secure & Private</h4>
                <p className="text-gray-600">
                  Your data is encrypted and protected. Only you and your co-parent have access.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <Heart className="w-8 h-8 text-teal-600 flex-shrink-0 mt-1" />
              <div>
                <h4 className="text-xl font-semibold mb-2">Child-Centered Design</h4>
                <p className="text-gray-600">
                  Built to keep children's needs first and reduce conflict between parents.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <Calendar className="w-8 h-8 text-teal-600 flex-shrink-0 mt-1" />
              <div>
                <h4 className="text-xl font-semibold mb-2">Real-Time Sync</h4>
                <p className="text-gray-600">
                  Updates happen instantly. Both parents always see the latest information.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <Users className="w-8 h-8 text-teal-600 flex-shrink-0 mt-1" />
              <div>
                <h4 className="text-xl font-semibold mb-2">Easy to Use</h4>
                <p className="text-gray-600">
                  Intuitive interface that works on desktop, tablet, and mobile devices.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <h3 className="text-3xl font-bold text-gray-900 mb-6">
            Ready to Simplify Co-Parenting?
          </h3>
          <p className="text-xl text-gray-600 mb-8">
            Join thousands of co-parents who communicate better and reduce conflict.
          </p>
          <Link href="/register">
            <Button size="lg" className="bg-teal-600 hover:bg-teal-700 text-lg px-12 py-6">
              Create Your Free Account
            </Button>
          </Link>
          <p className="text-sm text-gray-500 mt-4">
            No credit card required. Start using CoParent in minutes.
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 mt-20">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-400">
            © 2025 CoParent. Built with ❤️ for families.
          </p>
        </div>
      </footer>
    </div>
  );
}
