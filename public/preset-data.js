// Public names and avatar configurations from PiBot builtin templates.
export const presetCatalog = [
  {
    "id": "developer",
    "name": "软件开发者",
    "blurb": "写代码、修 bug、做项目",
    "quickStart": "帮我看看这个仓库，列出改进点",
    "groups": [
      {
        "id": "dev-squad",
        "name": "软件开发小队",
        "summary": "项目经理统筹，前后端开发、测试和审查一起交付",
        "coordinator": "小管",
        "members": [
          {
            "id": "project-manager",
            "name": "项目经理",
            "displayName": "小管",
            "avatar": "/assets/avatars/role-project-manager.svg"
          },
          {
            "id": "frontend-dev",
            "name": "前端开发",
            "displayName": "小前",
            "avatar": "/assets/avatars/role-frontend-dev.svg"
          },
          {
            "id": "backend-dev",
            "name": "后端开发",
            "displayName": "小柏",
            "avatar": "/assets/avatars/role-backend-dev.svg"
          },
          {
            "id": "qa-engineer",
            "name": "测试工程师",
            "displayName": "小测",
            "avatar": "/assets/avatars/role-qa-engineer.svg"
          },
          {
            "id": "code-reviewer",
            "name": "代码审查员",
            "displayName": "小审",
            "avatar": "/assets/avatars/role-code-reviewer.svg"
          }
        ]
      }
    ],
    "roles": [
      {
        "id": "tech-writer",
        "name": "技术文档",
        "displayName": "小档",
        "avatar": "/assets/avatars/role-tech-writer.svg"
      }
    ]
  },
  {
    "id": "product-manager",
    "name": "产品经理",
    "blurb": "理需求、写文档、推进产品",
    "quickStart": "把这次用户访谈整理成需求",
    "groups": [
      {
        "id": "product-team",
        "name": "产品研发小组",
        "summary": "从需求、设计到开发测试，一个小组做完",
        "coordinator": "阿品",
        "members": [
          {
            "id": "product-manager",
            "name": "产品经理",
            "displayName": "阿品",
            "avatar": "/assets/avatars/role-product-manager.svg"
          },
          {
            "id": "ui-ux-designer",
            "name": "UI / UX 设计师",
            "displayName": "小设",
            "avatar": "/assets/avatars/role-ui-ux-designer.svg"
          },
          {
            "id": "fullstack-dev",
            "name": "全栈开发",
            "displayName": "小栈",
            "avatar": "/assets/avatars/role-fullstack-dev.svg"
          },
          {
            "id": "qa-engineer",
            "name": "测试工程师",
            "displayName": "小测",
            "avatar": "/assets/avatars/role-qa-engineer.svg"
          }
        ]
      }
    ],
    "roles": [
      {
        "id": "researcher",
        "name": "研究员",
        "displayName": "小研",
        "avatar": "/assets/avatars/role-researcher.svg"
      }
    ]
  },
  {
    "id": "designer",
    "name": "设计师",
    "blurb": "界面、视觉和配图",
    "quickStart": "给这个功能出三版界面方向",
    "groups": [
      {
        "id": "content-studio",
        "name": "内容工作室",
        "summary": "选题、文案、配图一条龙",
        "coordinator": "小媒",
        "members": [
          {
            "id": "social-media",
            "name": "新媒体运营",
            "displayName": "小媒",
            "avatar": "/assets/avatars/role-social-media.svg"
          },
          {
            "id": "copywriter",
            "name": "文案写手",
            "displayName": "小笔",
            "avatar": "/assets/avatars/role-copywriter.svg"
          },
          {
            "id": "image-designer",
            "name": "生图设计师",
            "displayName": "小图",
            "avatar": "/assets/avatars/role-image-designer.svg"
          }
        ]
      }
    ],
    "roles": [
      {
        "id": "ui-ux-designer",
        "name": "UI / UX 设计师",
        "displayName": "小设",
        "avatar": "/assets/avatars/role-ui-ux-designer.svg"
      }
    ]
  },
  {
    "id": "content-creator",
    "name": "内容创作者 / 新媒体",
    "blurb": "选题、写作、做内容",
    "quickStart": "下周发什么？给我 5 个选题",
    "groups": [
      {
        "id": "content-studio",
        "name": "内容工作室",
        "summary": "选题、文案、配图一条龙",
        "coordinator": "小媒",
        "members": [
          {
            "id": "social-media",
            "name": "新媒体运营",
            "displayName": "小媒",
            "avatar": "/assets/avatars/role-social-media.svg"
          },
          {
            "id": "copywriter",
            "name": "文案写手",
            "displayName": "小笔",
            "avatar": "/assets/avatars/role-copywriter.svg"
          },
          {
            "id": "image-designer",
            "name": "生图设计师",
            "displayName": "小图",
            "avatar": "/assets/avatars/role-image-designer.svg"
          }
        ]
      }
    ],
    "roles": [
      {
        "id": "translator",
        "name": "翻译",
        "displayName": "小译",
        "avatar": "/assets/avatars/role-translator.svg"
      }
    ]
  },
  {
    "id": "marketing",
    "name": "市场营销",
    "blurb": "投放、增长和品牌",
    "quickStart": "分析上个月的投放数据",
    "groups": [
      {
        "id": "growth-team",
        "name": "增长营销组",
        "summary": "内容、文案和数据一起推增长",
        "coordinator": "小媒",
        "members": [
          {
            "id": "social-media",
            "name": "新媒体运营",
            "displayName": "小媒",
            "avatar": "/assets/avatars/role-social-media.svg"
          },
          {
            "id": "copywriter",
            "name": "文案写手",
            "displayName": "小笔",
            "avatar": "/assets/avatars/role-copywriter.svg"
          },
          {
            "id": "data-analyst",
            "name": "数据分析师",
            "displayName": "小数",
            "avatar": "/assets/avatars/role-data-analyst.svg"
          }
        ]
      }
    ],
    "roles": []
  },
  {
    "id": "data-research",
    "name": "数据分析 / 研究",
    "blurb": "查资料、做分析、写报告",
    "quickStart": "整理这个领域近一年的研究",
    "groups": [
      {
        "id": "research-group",
        "name": "研究小组",
        "summary": "查资料、算数据、写成报告",
        "coordinator": "小研",
        "members": [
          {
            "id": "researcher",
            "name": "研究员",
            "displayName": "小研",
            "avatar": "/assets/avatars/role-researcher.svg"
          },
          {
            "id": "data-analyst",
            "name": "数据分析师",
            "displayName": "小数",
            "avatar": "/assets/avatars/role-data-analyst.svg"
          },
          {
            "id": "copywriter",
            "name": "文案写手",
            "displayName": "小笔",
            "avatar": "/assets/avatars/role-copywriter.svg"
          }
        ]
      }
    ],
    "roles": []
  },
  {
    "id": "student",
    "name": "学生",
    "blurb": "学知识、做练习、备考",
    "quickStart": "帮我制定这学期的复习计划",
    "groups": [
      {
        "id": "study-group",
        "name": "学习小组",
        "summary": "讲清概念、整理笔记、出练习题",
        "coordinator": "小研",
        "members": [
          {
            "id": "researcher",
            "name": "研究员",
            "displayName": "小研",
            "avatar": "/assets/avatars/role-researcher.svg"
          },
          {
            "id": "copywriter",
            "name": "文案写手",
            "displayName": "小笔",
            "avatar": "/assets/avatars/role-copywriter.svg"
          },
          {
            "id": "translator",
            "name": "翻译",
            "displayName": "小译",
            "avatar": "/assets/avatars/role-translator.svg"
          }
        ]
      }
    ],
    "roles": []
  },
  {
    "id": "teacher",
    "name": "教师 / 培训",
    "blurb": "备课、出题、做讲义",
    "quickStart": "把这章内容做成练习题",
    "groups": [
      {
        "id": "study-group",
        "name": "学习小组",
        "summary": "讲清概念、整理笔记、出练习题",
        "coordinator": "小研",
        "members": [
          {
            "id": "researcher",
            "name": "研究员",
            "displayName": "小研",
            "avatar": "/assets/avatars/role-researcher.svg"
          },
          {
            "id": "copywriter",
            "name": "文案写手",
            "displayName": "小笔",
            "avatar": "/assets/avatars/role-copywriter.svg"
          },
          {
            "id": "translator",
            "name": "翻译",
            "displayName": "小译",
            "avatar": "/assets/avatars/role-translator.svg"
          }
        ]
      }
    ],
    "roles": [
      {
        "id": "personal-assistant",
        "name": "个人助理",
        "displayName": "小助",
        "avatar": "/assets/avatars/role-personal-assistant.svg"
      }
    ]
  },
  {
    "id": "sales-ecommerce",
    "name": "销售 / 电商",
    "blurb": "商品文案、店铺内容和客户跟进",
    "quickStart": "写这款商品的详情页",
    "groups": [],
    "roles": [
      {
        "id": "copywriter",
        "name": "文案写手",
        "displayName": "小笔",
        "avatar": "/assets/avatars/role-copywriter.svg"
      },
      {
        "id": "social-media",
        "name": "新媒体运营",
        "displayName": "小媒",
        "avatar": "/assets/avatars/role-social-media.svg"
      },
      {
        "id": "personal-assistant",
        "name": "个人助理",
        "displayName": "小助",
        "avatar": "/assets/avatars/role-personal-assistant.svg"
      }
    ]
  },
  {
    "id": "admin-hr",
    "name": "行政 / HR / 办公",
    "blurb": "纪要、招聘和日常事务",
    "quickStart": "整理本周会议纪要和待办",
    "groups": [],
    "roles": [
      {
        "id": "personal-assistant",
        "name": "个人助理",
        "displayName": "小助",
        "avatar": "/assets/avatars/role-personal-assistant.svg"
      },
      {
        "id": "recruiter",
        "name": "招聘 / HR",
        "displayName": "小聘",
        "avatar": "/assets/avatars/role-recruiter.svg"
      },
      {
        "id": "project-manager",
        "name": "项目经理",
        "displayName": "小管",
        "avatar": "/assets/avatars/role-project-manager.svg"
      }
    ]
  },
  {
    "id": "ops-it",
    "name": "运维 / IT",
    "blurb": "部署、排障和文档",
    "quickStart": "检查这台服务器的部署脚本",
    "groups": [],
    "roles": [
      {
        "id": "devops",
        "name": "DevOps / 运维",
        "displayName": "小运",
        "avatar": "/assets/avatars/role-devops.svg"
      },
      {
        "id": "code-reviewer",
        "name": "代码审查员",
        "displayName": "小审",
        "avatar": "/assets/avatars/role-code-reviewer.svg"
      },
      {
        "id": "tech-writer",
        "name": "技术文档",
        "displayName": "小档",
        "avatar": "/assets/avatars/role-tech-writer.svg"
      }
    ]
  },
  {
    "id": "founder",
    "name": "创业者 / 自由职业",
    "blurb": "从想法到产品，一个人当一个团队",
    "quickStart": "帮我梳理这个想法的第一个版本",
    "groups": [
      {
        "id": "product-team",
        "name": "产品研发小组",
        "summary": "从需求、设计到开发测试，一个小组做完",
        "coordinator": "阿品",
        "members": [
          {
            "id": "product-manager",
            "name": "产品经理",
            "displayName": "阿品",
            "avatar": "/assets/avatars/role-product-manager.svg"
          },
          {
            "id": "ui-ux-designer",
            "name": "UI / UX 设计师",
            "displayName": "小设",
            "avatar": "/assets/avatars/role-ui-ux-designer.svg"
          },
          {
            "id": "fullstack-dev",
            "name": "全栈开发",
            "displayName": "小栈",
            "avatar": "/assets/avatars/role-fullstack-dev.svg"
          },
          {
            "id": "qa-engineer",
            "name": "测试工程师",
            "displayName": "小测",
            "avatar": "/assets/avatars/role-qa-engineer.svg"
          }
        ]
      }
    ],
    "roles": [
      {
        "id": "personal-assistant",
        "name": "个人助理",
        "displayName": "小助",
        "avatar": "/assets/avatars/role-personal-assistant.svg"
      }
    ]
  }
];
