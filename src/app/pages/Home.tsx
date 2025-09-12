import { Hero } from '@/components/public/Hero'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function Home() {
  const features = [
    {
      title: "Advanced Research Agents",
      description: "Leverage intelligent agents for web search, data analysis, and comprehensive investigations.",
      icon: "🔍"
    },
    {
      title: "GitHub Integration",
      description: "Automate repository management, issue tracking, and pull requests with AI-powered assistance.",
      icon: "💻"
    },
    {
      title: "Workflow Automation",
      description: "Build and execute complex workflows for research, reporting, and development tasks.",
      icon: "⚡"
    },
    {
      title: "RAG & Memory Systems",
      description: "Utilize retrieval-augmented generation and advanced memory processors for context-aware responses.",
      icon: "🧠"
    },
    {
      title: "Observability & Tracing",
      description: "Monitor agent performance and workflow execution with built-in tracing and logging.",
      icon: "📊"
    },
    {
      title: "MCP Tools",
      description: "Extend capabilities with Model Context Protocol tools for external integrations.",
      icon: "🔧"
    }
  ]

  return (
    <div className="space-y-8">
      <Hero />
      
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Powerful Features</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Discover how Mastra Deep Research can transform your workflow with AI-driven automation.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-2xl mb-2">{feature.icon}</CardTitle>
                  <CardTitle>{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Ready to Start?</h2>
          <p className="text-lg text-gray-600 mb-8">
            Join thousands of researchers accelerating their work with Mastra's intelligent agents.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="px-8">
              Get Started Free
            </Button>
            <Button variant="outline" size="lg" className="px-8">
              View Documentation
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
