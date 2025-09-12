import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '../ui/carousel'

const testimonials = [
  {
    name: "Dr. Elena Rodriguez",
    role: "AI Research Lead",
    content: "Mastra's agents have revolutionized our research pipeline. The GitHub integration alone saved us weeks of manual work. The glassmorphism UI and animated transitions make the experience truly immersive.",
    avatar: "ER",
    rating: 5
  },
  {
    name: "Alex Chen",
    role: "Software Architect",
    content: "The workflow automation is cutting-edge. We've built complex multi-agent systems that adapt in real-time. The hover-lift effects and gradient animations add a professional polish.",
    avatar: "AC",
    rating: 5
  },
  {
    name: "Sarah Patel",
    role: "Data Scientist",
    content: "RAG and memory processors provide context-aware insights that traditional tools can't match. The modern design with animated gradients keeps users engaged throughout long sessions.",
    avatar: "SP",
    rating: 5
  },
  {
    name: "Michael Thompson",
    role: "DevOps Engineer",
    content: "MCP tools integration is seamless. The responsive design and fade-in animations make the dashboard feel alive and intuitive for daily use.",
    avatar: "MT",
    rating: 5
  }
]

export function Testimonials() {
  return (
    <section className="py-20 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 relative overflow-hidden">
      <div className="absolute inset-0 opacity-20 animated-gradient"></div>
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 slide-up">
          <h2 className="text-4xl md:text-5xl font-bold gradient-text mb-6 text-shadow-lg">
            What Our Users Say
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto fade-in">
            Join thousands of developers and researchers who trust Mastra for their AI-powered workflows.
          </p>
        </div>
        <div className="carousel-container w-full max-w-4xl mx-auto">
          <Carousel className="w-full">
            <CarouselContent className="-ml-1">
              {testimonials.map((testimonial, index) => (
                <CarouselItem key={index} className="pl-1 md:basis-1/2 lg:basis-1/2">
                  <Card className="glass hover-lift backdrop-blur-xl border-white/20 bg-white/10 dark:bg-white/5 transition-all duration-300 slide-up">
                    <CardHeader>
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-2xl font-bold text-white">
                          {testimonial.avatar}
                        </div>
                        <div>
                          <CardTitle className="text-lg gradient-text">{testimonial.name}</CardTitle>
                          <CardDescription className="text-sm text-gray-500 dark:text-gray-400">{testimonial.role}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-gray-700 dark:text-gray-300 italic leading-relaxed fade-in">
                        "{testimonial.content}"
                      </p>
                      <div className="flex gap-1">
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <span key={i} className="text-yellow-400">★</span>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="glass h-12 w-12 rounded-full backdrop-blur-md border-white/20" />
            <CarouselNext className="glass h-12 w-12 rounded-full backdrop-blur-md border-white/20" />
          </Carousel>
        </div>
      </div>
    </section>
  )
}