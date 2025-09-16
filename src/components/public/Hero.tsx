import { Button } from '../ui/button'

export function Hero() {
  return (
    <section className="min-h-[80vh] relative overflow-hidden flex items-center justify-center animated-gradient">
      <div className="absolute inset-0 bg-black/10 backdrop-blur-sm"></div>
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center slide-up">
        <div className="glass rounded-3xl p-8 mb-8 max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-bold gradient-text mb-6 text-shadow-lg">
            AI-Powered Deep Research
          </h1>
          <p className="text-xl text-gray-100 dark:text-gray-200 max-w-3xl mx-auto mb-8 fade-in">
            Harness advanced agents and workflows to accelerate your research, automate GitHub tasks, and generate comprehensive reports with Mastra's cutting-edge AI.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" className="px-8 hover-lift pulse glass bg-transparent border-white/20 text-white backdrop-blur-md">
            Start Research
          </Button>
          <Button variant="outline" size="lg" className="px-8 hover-lift slide-left glass bg-transparent border-white/20 text-white backdrop-blur-md">
            Explore Agents
          </Button>
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/20 to-transparent"></div>
    </section>
  )
}
