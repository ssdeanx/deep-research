export function Home() {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Welcome to Mastra Deep Research</h1>
        <p className="text-gray-600 mb-6">
          Your AI-powered research assistant with advanced agent capabilities and workflow automation.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">Research Agent</h3>
            <p className="text-blue-700 text-sm">
              Conduct comprehensive research using web search and analysis tools.
            </p>
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-semibold text-green-900 mb-2">GitHub Agent</h3>
            <p className="text-green-700 text-sm">
              Manage repositories, issues, and pull requests with AI assistance.
            </p>
          </div>

          <div className="bg-purple-50 p-4 rounded-lg">
            <h3 className="font-semibold text-purple-900 mb-2">Workflow Engine</h3>
            <p className="text-purple-700 text-sm">
              Automate complex research and development workflows.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
