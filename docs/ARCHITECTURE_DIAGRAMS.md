# System Architecture Diagrams

## Complete System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           Mastra Deep Research System                           │
├─────────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────┐ │
│  │  Workflows  │  │   Agents    │  │   Tools     │  │ Memory Proc │  │ Tracing │ │
│  │             │  │             │  │             │  │             │  │         │ │
│  │ • Research  │  │ • Research  │  │ • Web       │  │ • TokenLim  │  │ • Open  │ │
│  │ • Report    │  │ • Report    │  │ • Vector    │  │ • Personal  │  │ • Tel   │ │
│  │ • Comprehen│  │ • Evaluation │  │ • Chunking  │  │ • ErrorCorr │  │ • Child │ │
│  │ • Generate  │  │ • Learning  │  │ • Rerank    │  │ • Circuit   │  │ • Spans │ │
│  │             │  │ • Web Sum   │  │ • Graph RAG │  │ • Bayesian  │  │ • Perf  │ │
│  │             │  │ • RAG       │  │ • Data File │  │ • Knowledge │  │ • Error │ │
│  │             │  └─────────────┘  │ • Weather   │  └─────────────┘  └─────────┘ │
│  └─────────────┘                   └─────────────┘                               │
├─────────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │   RAG Pipeline  │  │   Dual Storage  │  │ Google AI 2.5   │  │   Caching   │ │
│  │                 │  │                 │  │                 │  │             │ │
│  │ • Vector Search │  │ • LibSQL Main  │  │ • Gemini 2.5    │  │ • Explicit  │ │
│  │ • Chunking      │  │ • LibSQL Vector│  │ • Search Ground │  │ • Implicit  │ │
│  │ • Reranking     │  │ • Health Checks│  │ • Thinking      │  │ • Cost Opt  │ │
│  │ • Graph RAG     │  │ • Tracing Int  │  │ • File Inputs   │  │ • Search    │ │
│  │ • Hybrid Search │  │ • Performance  │  │ • Embeddings    │  │ • Grounding │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  └─────────────┘ │
├─────────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────┐ │
│  │   Networks  │  │ Integration │  │   APIs     │  │   Memory    │  │ Monitor │ │
│  │             │  │             │  │             │  │             │  │         │ │
│  │ • Complex   │  │ • MCP       │  │ • REST      │  │ • Context   │  │ • Jaeger│ │
│  │ • Research  │  │ • WebSocket │  │ • GraphQL   │  │ • Sessions  │  │ • Prom  │ │
│  │ • Multi-    │  │ • OpenTel   │  │ • Streaming │  │ • User Pref │  │ • Graf  │ │
│  │ • Agent     │  │ • Streaming │  │ • Real-time │  │ • Hierarch  │  │ • Dash  │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘  └─────────┘ │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## RAG Pipeline Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Document      │    │   Intelligent   │    │   Vector        │    │   Multi-stage   │
│   Ingestion     │───►│   Chunking      │───►│   Indexing      │───►│   Retrieval     │
│                 │    │                 │    │                 │    │                 │
│ • PDF/Text      │    │ • Overlapping    │    │ • Embeddings    │    │ • Semantic      │
│ • HTML/Markdown │    │ • Metadata       │    │ • Multiple      │    │ • Re-ranking    │
│ • JSON/XML      │    │ • Quality        │    │ • Indexes       │    │ • Filtering     │
│ • File Inputs   │    │ • Format Support │    │ • Performance   │    │ • Diversity     │
└─────────────────┘    └─────────────────┘    └─────────────────┘    └─────────────────┘
                                                                 │
                                                                 ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Graph RAG     │    │   Context       │    │   Generation    │    │   Response      │
│   Enhancement   │    │   Augmentation  │    │   with RAG       │    │   Synthesis     │
│                 │    │                 │    │                 │    │                 │
│ • Knowledge     │    │ • Dynamic        │    │ • Gemini 2.5    │    │ • Coherent      │
│ • Graph         │    │ • Window         │    │ • Search         │    │ • Citations     │
│ • Reasoning     │    │ • Expansion      │    │ • Grounding      │    │ • Sources       │
│ • Entity Res    │    │ • Multi-doc      │    │ • Thinking       │    │ • Validation    │
└─────────────────┘    └─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Memory Processors Pipeline

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Raw Input     │    │   Content       │    │   Semantic      │    │   Advanced      │
│   Messages      │───►│   Optimization  │───►│   Enhancement   │───►│   Processing    │
│                 │    │                 │    │                 │    │                 │
│ • User Messages │    │ • TokenLimiter  │    │ • Personalization│    │ • Knowledge    │
│ • Context Data  │    │ • ErrorCorrect  │    │ • CitationExt   │    │ • Graph         │
│ • System State  │    │ • CircuitBreak  │    │ • MultiPerspect │    │ • Bayesian      │
└─────────────────┘    └─────────────────┘    └─────────────────┘    └─────────────────┘
                                                                 │
                                                                 ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Reasoning     │    │   Quality       │    │   Fault         │    │   Optimized     │
│   Enhancement   │    │   Assurance     │    │   Tolerance     │    │   Output        │
│                 │    │                 │    │                 │    │                 │
│ • Temporal      │    │ • Uncertainty   │    │ • CircuitBreak  │    │ • Filtered      │
│ • Hierarchical  │    │ • Quantification│    │ • Recovery      │    │ • Enriched      │
│ • Causal        │    │ • Validation    │    │ • Monitoring    │    │ • Ranked        │
│ • Probabilistic │    │ • Scoring       │    │ • Health Check  │    │ • Context       │
└─────────────────┘    └─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Tracing & Observability Flow

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Application   │    │   Span          │    │   Context       │    │   Export        │
│   Operations    │───►│   Creation      │───►│   Propagation   │───►│   & Storage     │
│                 │    │                 │    │                 │    │                 │
│ • Agent Runs    │    │ • AISpanType    │    │ • Runtime       │    │ • Jaeger        │
│ • Tool Calls    │    │ • Custom Spans  │    │ • User Context  │    │ • Prometheus    │
│ • Memory Ops    │    │ • Child Spans   │    │ • Session Data  │    │ • Grafana       │
│ • API Calls     │    │ • Error Spans   │    │ • Request ID    │    │ • Custom Dash   │
└─────────────────┘    └─────────────────┘    └─────────────────┘    └─────────────────┘
                                                                 │
                                                                 ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Performance   │    │   Error         │    │   Business      │    │   Alerting      │
│   Monitoring    │    │   Tracking      │    │   Metrics       │    │   & Actions     │
│                 │    │                 │    │                 │    │                 │
│ • Latency       │    │ • Exception     │    │ • User Satis    │    │ • Threshold     │
│ • Throughput    │    │ • Stack Traces  │    │ • Cost Eff      │    │ • Notifications │
│ • Resource Use  │    │ • Error Context │    │ • Success Rate  │    │ • Auto-remed    │
│ • Cache Hits    │    │ • Recovery      │    │ • Usage Stats   │    │ • Escalation    │
└─────────────────┘    └─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Data Flow Architecture

```
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│   User Input    │         │   Processing    │         │   Storage       │
│                 │         │   Pipeline      │         │   Layer         │
│ • Queries       │────────►│ • Agents        │────────►│ • LibSQL Main  │
│ • Documents     │         │ • Workflows     │         │ • LibSQL Vector│
│ • Preferences   │         │ • Tools         │         │ • File System  │
│ • Context       │         │ • Memory Proc   │         │ • Cache Layer  │
└─────────────────┘         └─────────────────┘         └─────────────────┘
         │                           │                           │
         │                           │                           │
         ▼                           ▼                           ▼
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│   RAG System    │         │   AI Models     │         │   Observability │
│                 │         │                 │         │                 │
│ • Retrieval     │◄────────│ • Google AI     │────────►│ • Tracing       │
│ • Generation    │         │ • Gemini 2.5    │         │ • Metrics       │
│ • Synthesis     │         │ • Embeddings    │         │ • Monitoring    │
│ • Validation    │         │ • Search Ground │         │ • Alerting      │
└─────────────────┘         └─────────────────┘         └─────────────────┘
```

## Component Interaction Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Component Interactions                       │
├─────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐             │
│  │   Agents    │    │  Workflows  │    │   Tools     │             │
│  │             │    │             │    │             │             │
│  │ • Research  │◄──►│ • Research  │◄──►│ • Web Search│◄───┐        │
│  │ • Report    │    │ • Report    │    │ • Vector Q  │    │        │
│  │ • RAG       │    │ • Generate  │    │ • Chunking  │    │        │
│  └─────────────┘    └─────────────┘    │ • Rerank    │    │        │
│                                        └─────────────┘    │        │
│                                             │            │        │
│                                             ▼            ▼        │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐             │
│  │   Memory    │    │   Storage   │    │   Tracing   │             │
│  │  Processors │    │             │    │             │             │
│  │             │    │ • LibSQL    │    │ • OpenTel   │             │
│  │ • 11 Proc   │───►│ • Vector DB │───►│ • Child     │             │
│  │ • Context   │    │ • Health    │    │ • Spans     │             │
│  │ • Optimize  │    │ • Checks    │    │ • Metrics   │             │
│  └─────────────┘    └─────────────┘    └─────────────┘             │
│                                             │            │        │
│                                             ▼            ▼        │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐             │
│  │   RAG       │    │ Google AI   │    │   Cache     │             │
│  │  Pipeline   │    │             │    │             │             │
│  │             │    │ • Gemini 2.5│    │ • Explicit  │             │
│  │ • Retrieval │◄──►│ • Search G  │◄──►│ • Implicit  │             │
│  │ • Generation│    │ • Thinking  │    │ • Cost Opt  │             │
│  │ • Graph RAG │    │ • Embeddings│    │ • Search G  │             │
│  └─────────────┘    └─────────────┘    └─────────────┘             │
├─────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐             │
│  │   Networks  │    │ Integration │    │   APIs     │             │
│  │             │    │             │    │             │             │
│  │ • Complex   │    │ • MCP       │    │ • REST      │             │
│  │ • Research  │    │ • WebSocket │    │ • GraphQL   │             │
│  │ • Multi-Ag  │    │ • OpenTel   │    │ • Streaming │             │
│  └─────────────┘    └─────────────┘    └─────────────┘             │
└─────────────────────────────────────────────────────────────────────┘
```

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                          Deployment Architecture                     │
├─────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐ │
│  │   Application   │    │   Database      │    │   Cache/Queue   │ │
│  │   Server        │    │   Layer         │    │   Layer         │ │
│  │                 │    │                 │    │                 │ │
│  │ • Node.js       │    │ • LibSQL Main  │    │ • Redis         │ │
│  │ • Express/Fast  │    │ • LibSQL Vector│    │ • In-memory     │ │
│  │ • API Routes    │    │ • File System  │    │ • Message Queue │ │
│  │ • WebSocket     │    │ • Health Mon   │    │ • Job Queue     │ │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘ │
├─────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐ │
│  │   AI Services   │    │   External      │    │   Monitoring    │ │
│  │                 │    │   APIs          │    │                 │ │
│  │ • Google AI     │    │ • Exa Search   │    │ • Jaeger        │ │
│  │ • Embeddings    │    │ • Weather API  │    │ • Prometheus    │ │
│  │ • Search Ground │    │ • File Storage │    │ • Grafana       │ │
│  │ • Caching       │    │ • MCP Servers  │    │ • Alert Manager │ │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘ │
├─────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐ │
│  │   Load          │    │   Security      │    │   Backup        │ │
│  │   Balancing     │    │                 │    │                 │ │
│  │ • Nginx/HAProxy │    │ • API Keys      │    │ • Database      │ │
│  │ • Auto Scaling  │    │ • Rate Limiting │    │ • File System   │ │
│  │ • Health Checks │    │ • Input Valid   │    │ • Incremental   │ │
│  │ • SSL/TLS       │    │ • CORS          │    │ • Point-in-time │ │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

## Performance Optimization Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                     Performance Optimization                        │
├─────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐ │
│  │   Caching       │    │   Batch         │    │   Streaming     │ │
│  │   Layer         │    │   Processing    │    │   Processing    │ │
│  │                 │    │                 │    │                 │ │
│  │ • Vector Cache  │    │ • Embedding     │    │ • Real-time     │ │
│  │ • Query Cache   │    │ • Batch         │    │ • WebSocket     │ │
│  │ • Content Cache │    │ • Index Updates │    │ • Event-driven  │ │
│  │ • Memory Cache  │    │ • Bulk Ops      │    │ • Async Proc    │ │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘ │
├─────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐ │
│  │   Resource      │    │   Connection    │    │   Memory        │ │
│  │   Management    │    │   Pooling       │    │   Management    │ │
│  │                 │    │                 │    │                 │ │
│  │ • CPU Limits    │    │ • Database      │    │ • GC Tuning     │ │
│  │ • Memory Limits │    │ • API Clients   │    │ • Object Pools  │ │
│  │ • I/O Limits    │    │ • Thread Pools  │    │ • Buffer Mgmt   │ │
│  │ • Network BW    │    │ • Connection    │    │ • Cache Sizes   │ │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘ │
├─────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐ │
│  │   Monitoring    │    │   Auto-scaling  │    │   Load          │ │
│  │   & Alerting    │    │                 │    │   Balancing     │ │
│  │                 │    │ • Horizontal    │    │ • Request       │ │
│  │ • Metrics       │    │ • Vertical      │    │ • Distribution  │ │
│  │ • Thresholds    │    │ • Resource      │    │ • Health Checks │ │
│  │ • Alerts        │    │ • Based         │    │ • Failover      │ │
│  │ • Dashboards    │    │ • Scaling       │    │ • Session Aff   │ │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

---

*These architecture diagrams represent the current system design as of the latest implementation. Each diagram shows different aspects of the system architecture, from high-level component interactions to detailed data flows and deployment considerations.*