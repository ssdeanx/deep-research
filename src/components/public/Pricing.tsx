import { Button } from '../ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'

const plans = [
  {
    name: "Starter",
    price: "$29",
    description: "Perfect for individual researchers and small teams.",
    features: [
      "3 Active Agents",
      "Basic Workflow Automation",
      "GitHub Integration",
      "RAG & Memory Basics",
      "Email Support"
    ],
    popular: false
  },
  {
    name: "Professional",
    price: "$99",
    description: "Ideal for growing teams and advanced research needs.",
    features: [
      "Unlimited Agents",
      "Advanced Workflow Engine",
      "Full GitHub MCP Tools",
      "Advanced RAG & Memory",
      "Priority Support",
      "Observability Dashboard"
    ],
    popular: true
  },
  {
    name: "Enterprise",
    price: "Custom",
    description: "Custom solutions for large organizations and complex workflows.",
    features: [
      "Unlimited Everything",
      "Custom Agent Development",
      "Dedicated MCP Server",
      "Advanced Security & Compliance",
      "24/7 Enterprise Support",
      "Custom Integrations"
    ],
    popular: false
  }
]

export function Pricing() {
  return (
    <section className="py-20 relative overflow-hidden">
      <div className="absolute inset-0 opacity-10 animated-gradient"></div>
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 slide-up">
          <h2 className="text-4xl md:text-5xl font-bold gradient-text mb-6 text-shadow-lg">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto fade-in">
            Choose the plan that best fits your research and development needs. All plans include our cutting-edge AI capabilities.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <Card key={index} className={`glass hover-lift backdrop-blur-xl border-white/20 bg-white/10 dark:bg-white/5 transition-all duration-500 slide-up ${plan.popular ? 'scale-105 ring-2 ring-primary/20' : ''}`}>
              <CardHeader>
                <CardTitle className="text-2xl font-bold gradient-text">{plan.name}</CardTitle>
                {plan.popular && (
                  <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary/20 text-primary">
                    Most Popular
                  </div>
                )}
                <CardDescription className="text-lg text-gray-500 dark:text-gray-400">
                  {plan.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-4xl font-bold text-center gradient-text mb-4">{plan.price}</div>
                <ul className="space-y-3">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-3 text-gray-700 dark:text-gray-300 fade-in">
                      <span className="text-green-500">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button className="w-full hover-lift glass bg-transparent border-white/20 text-white backdrop-blur-md transition-all duration-300">
                  {plan.name === 'Enterprise' ? 'Contact Sales' : 'Get Started'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}