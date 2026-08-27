from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    KeepTogether,
    PageBreak,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)


ROOT = Path(r"D:\MarketMind\Team_1_Small_Biz_Sales_AI")
OUTPUT = ROOT / "output" / "pdf" / "marketmind-milestone-3-4-workflow.pdf"
OUTPUT.parent.mkdir(parents=True, exist_ok=True)

PAGE_W, PAGE_H = A4
NAVY = colors.HexColor("#071427")
NAVY_2 = colors.HexColor("#10213C")
INK = colors.HexColor("#182844")
MUTED = colors.HexColor("#5D6B82")
BLUE = colors.HexColor("#2858E8")
PURPLE = colors.HexColor("#6948F5")
TEAL = colors.HexColor("#0AAE9B")
AMBER = colors.HexColor("#D47B00")
RED = colors.HexColor("#C53F55")
PALE = colors.HexColor("#F3F6FB")
LINE = colors.HexColor("#D9E1EE")
WHITE = colors.white


styles = getSampleStyleSheet()
styles.add(
    ParagraphStyle(
        name="CoverTitle",
        parent=styles["Title"],
        fontName="Helvetica-Bold",
        fontSize=27,
        leading=31,
        textColor=WHITE,
        alignment=TA_LEFT,
        spaceAfter=8,
    )
)
styles.add(
    ParagraphStyle(
        name="BulletMark",
        parent=styles["BodyText"],
        fontName="Helvetica-Bold",
        fontSize=8.7,
        leading=12.1,
        textColor=PURPLE,
    )
)
styles.add(
    ParagraphStyle(
        name="CoverSub",
        parent=styles["BodyText"],
        fontName="Helvetica",
        fontSize=12,
        leading=17,
        textColor=colors.HexColor("#DCE6FF"),
    )
)
styles.add(
    ParagraphStyle(
        name="H1x",
        parent=styles["Heading1"],
        fontName="Helvetica-Bold",
        fontSize=18,
        leading=22,
        textColor=NAVY,
        spaceBefore=0,
        spaceAfter=9,
    )
)
styles.add(
    ParagraphStyle(
        name="H2x",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=11.2,
        leading=14,
        textColor=BLUE,
        spaceBefore=8,
        spaceAfter=5,
    )
)
styles.add(
    ParagraphStyle(
        name="Bodyx",
        parent=styles["BodyText"],
        fontName="Helvetica",
        fontSize=8.7,
        leading=12.1,
        textColor=INK,
        spaceAfter=5,
    )
)
styles.add(
    ParagraphStyle(
        name="Smallx",
        parent=styles["BodyText"],
        fontName="Helvetica",
        fontSize=7.5,
        leading=10,
        textColor=MUTED,
    )
)
styles.add(
    ParagraphStyle(
        name="TableHead",
        parent=styles["BodyText"],
        fontName="Helvetica-Bold",
        fontSize=7.4,
        leading=9.2,
        textColor=WHITE,
    )
)
styles.add(
    ParagraphStyle(
        name="TableBody",
        parent=styles["BodyText"],
        fontName="Helvetica",
        fontSize=7.2,
        leading=9.5,
        textColor=INK,
    )
)
styles.add(
    ParagraphStyle(
        name="TableStrong",
        parent=styles["BodyText"],
        fontName="Helvetica-Bold",
        fontSize=7.3,
        leading=9.5,
        textColor=INK,
    )
)
styles.add(
    ParagraphStyle(
        name="Callout",
        parent=styles["BodyText"],
        fontName="Helvetica",
        fontSize=8.4,
        leading=11.6,
        textColor=INK,
        leftIndent=7,
        rightIndent=7,
        spaceBefore=4,
        spaceAfter=4,
    )
)
styles.add(
    ParagraphStyle(
        name="Flow",
        parent=styles["BodyText"],
        fontName="Helvetica-Bold",
        fontSize=7.7,
        leading=9.5,
        alignment=TA_CENTER,
        textColor=INK,
    )
)


def P(text, style="Bodyx"):
    return Paragraph(text, styles[style])


def bullets(items, level=0):
    content_width = PAGE_W - 38 * mm
    dash_width = (5 + level * 3) * mm
    t = Table(
        [[P("-", "BulletMark"), P(item)] for item in items],
        colWidths=[dash_width, content_width - dash_width],
        hAlign="LEFT",
        spaceAfter=5,
    )
    t.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 0),
                ("RIGHTPADDING", (0, 0), (-1, -1), 2),
                ("TOPPADDING", (0, 0), (-1, -1), 0),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 1),
            ]
        )
    )
    return t


def table(headers, rows, widths, font_size=7.2):
    data = [[P(h, "TableHead") for h in headers]]
    for row in rows:
        data.append([
            Paragraph(str(value), ParagraphStyle(
                name=f"cell-{font_size}-{i}",
                parent=styles["TableBody"],
                fontSize=font_size,
                leading=font_size + 2.1,
            ))
            for i, value in enumerate(row)
        ])
    t = Table(data, colWidths=widths, repeatRows=1, hAlign="LEFT")
    t.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), NAVY_2),
                ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("GRID", (0, 0), (-1, -1), 0.35, LINE),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, PALE]),
                ("LEFTPADDING", (0, 0), (-1, -1), 5),
                ("RIGHTPADDING", (0, 0), (-1, -1), 5),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ]
        )
    )
    return t


def callout(title, text, color=TEAL):
    box = Table(
        [[P(f"<b>{title}</b><br/>{text}", "Callout")]],
        colWidths=[PAGE_W - 38 * mm],
        hAlign="LEFT",
    )
    box.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#EEF8F7")),
                ("BOX", (0, 0), (-1, -1), 0.8, color),
                ("LINEBEFORE", (0, 0), (0, -1), 4, color),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ("TOPPADDING", (0, 0), (-1, -1), 7),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
            ]
        )
    )
    return box


def flow_row(labels):
    cells = []
    widths = []
    for idx, label in enumerate(labels):
        cells.append(P(label, "Flow"))
        widths.append(28 * mm)
        if idx < len(labels) - 1:
            cells.append(P("&gt;", "Flow"))
            widths.append(7 * mm)
    t = Table([cells], colWidths=widths, hAlign="CENTER")
    commands = [
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 3),
        ("RIGHTPADDING", (0, 0), (-1, -1), 3),
        ("TOPPADDING", (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
    ]
    for idx in range(0, len(cells), 2):
        commands.extend(
            [
                ("BACKGROUND", (idx, 0), (idx, 0), PALE),
                ("BOX", (idx, 0), (idx, 0), 0.55, LINE),
            ]
        )
    t.setStyle(TableStyle(commands))
    return t


def page_chrome(canvas, doc):
    canvas.saveState()
    if doc.page == 1:
        canvas.setFillColor(NAVY)
        canvas.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)
        canvas.setFillColor(PURPLE)
        canvas.circle(PAGE_W - 26 * mm, PAGE_H - 28 * mm, 34 * mm, fill=1, stroke=0)
        canvas.setFillColor(colors.HexColor("#315CEB"))
        canvas.circle(PAGE_W - 6 * mm, PAGE_H - 58 * mm, 25 * mm, fill=1, stroke=0)
    else:
        canvas.setStrokeColor(LINE)
        canvas.setLineWidth(0.5)
        canvas.line(18 * mm, PAGE_H - 15 * mm, PAGE_W - 18 * mm, PAGE_H - 15 * mm)
        canvas.setFont("Helvetica-Bold", 8)
        canvas.setFillColor(NAVY)
        canvas.drawString(19 * mm, PAGE_H - 11.5 * mm, "MARKETMIND AI")
        canvas.setFont("Helvetica", 7.5)
        canvas.setFillColor(MUTED)
        canvas.drawRightString(PAGE_W - 19 * mm, PAGE_H - 11.5 * mm, "MILESTONE 3 AND 4 WORKFLOW")
    canvas.setFillColor(WHITE if doc.page == 1 else MUTED)
    canvas.setFont("Helvetica", 7.2)
    canvas.drawString(19 * mm, 10 * mm, "Implementation-aligned plan | 20 August 2026")
    canvas.drawRightString(PAGE_W - 19 * mm, 10 * mm, f"Page {doc.page}")
    canvas.restoreState()


doc = BaseDocTemplate(
    str(OUTPUT),
    pagesize=A4,
    leftMargin=19 * mm,
    rightMargin=19 * mm,
    topMargin=20 * mm,
    bottomMargin=17 * mm,
    title="MarketMind AI - Milestone 3 and 4 Workflow",
    author="MarketMind project team",
    subject="Datasets, models, integration workflow and delivery gates",
)
frame = Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height, id="normal")
doc.addPageTemplates(PageTemplate(id="all", frames=[frame], onPage=page_chrome))

story = []

# Cover
story.extend(
    [
        Spacer(1, 48 * mm),
        P("MARKETMIND AI", "CoverSub"),
        Spacer(1, 3 * mm),
        P("Milestone 3 and 4<br/>Workflow Plan", "CoverTitle"),
        P(
            "A practical continuation of the completed authentication, business operations, "
            "customer segmentation and forecasting platform.",
            "CoverSub",
        ),
        Spacer(1, 14 * mm),
    ]
)
cover_cards = Table(
    [
        [P("CURRENT BASELINE", "TableHead"), P("MILESTONE 3", "TableHead"), P("MILESTONE 4", "TableHead")],
        [
            P("Milestones 1 and 2 complete<br/>FastAPI + React + RBAC + database<br/>Segmentation and forecasting", "Smallx"),
            P("Recommendations<br/>Churn prediction<br/>ML anomaly detection", "Smallx"),
            P("Testing and hardening<br/>Deployment and monitoring<br/>UAT and final documentation", "Smallx"),
        ],
    ],
    colWidths=[53 * mm, 53 * mm, 53 * mm],
    hAlign="LEFT",
)
cover_cards.setStyle(
    TableStyle(
        [
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#263B69")),
            ("BACKGROUND", (0, 1), (-1, -1), colors.HexColor("#F5F7FD")),
            ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#536992")),
            ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#536992")),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("LEFTPADDING", (0, 0), (-1, -1), 8),
            ("RIGHTPADDING", (0, 0), (-1, -1), 8),
            ("TOPPADDING", (0, 0), (-1, -1), 8),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ]
    )
)
story.extend([cover_cards, Spacer(1, 16 * mm)])
story.append(
    P(
        "Planning rule: no dashboard may show a model-generated insight until the tenant has enough "
        "eligible data and the model passes its defined quality gate.",
        "CoverSub",
    )
)
story.append(PageBreak())

# M3 workflow
story.extend(
    [
        P("1. Milestone 3 workflow", "H1x"),
        P(
            "Goal: add customer retention, product recommendation and anomaly intelligence without "
            "breaking the existing tenant, store, seller and Administrator security model.",
        ),
        flow_row(["Confirm definitions", "Prepare data", "Build features", "Train and compare", "Publish safely"]),
        Spacer(1, 4 * mm),
    ]
)
m3_steps = [
    ("1", "Freeze the business definitions", "Agree churn inactivity window, eligible customers, recommendation context, anomaly severity and alert owners."),
    ("2", "Extend data contracts", "Add consent, dated engagement events, customer-product baskets, inventory movements and feedback fields without changing existing IDs."),
    ("3", "Build reusable features", "Reuse RFM, engagement, segment, forecast residual and stock signals; add point-in-time churn labels and customer-item interaction features."),
    ("4", "Establish simple baselines", "Use inactivity rules, popular/category products, association rules and statistical thresholds before evaluating complex models."),
    ("5", "Train and evaluate", "Use chronological splits, compare candidates, inspect role/store slices and reject leakage, unstable results or excessive false alerts."),
    ("6", "Store versioned outputs", "Persist model run, feature version, scope, metrics, prediction time and customer/product/alert outputs. Never overwrite actual records."),
    ("7", "Connect APIs and dashboards", "Expose role-scoped results, clear not-ready states, explanations, feedback and refresh controls through FastAPI and React."),
    ("8", "Run acceptance checks", "Repeat imports, tenant-isolation tests, model gates, API contracts, frontend states and human review of recommendations and alerts."),
]
story.append(table(["Step", "Work", "Expected result"], m3_steps, [13 * mm, 47 * mm, 112 * mm], 7.35))
story.extend(
    [
        Spacer(1, 4 * mm),
        callout(
            "Recommended build order",
            "Churn labels and datasets first; then association-rule recommendations; then churn candidates; "
            "then Isolation Forest anomaly scoring. This order gives the backend and frontend stable response "
            "contracts before adding heavier models.",
            PURPLE,
        ),
        PageBreak(),
    ]
)

# Dataset map
story.extend(
    [
        P("2. Dataset plan", "H1x"),
        P(
            "The current datasets remain useful. Milestone 3 should extend them with governed production "
            "fields instead of replacing the Milestone 1 and 2 pipelines.",
        ),
    ]
)
dataset_rows = [
    ("Online Retail II transactions", "Already used", "Invoice, customer, product, quantity, price, date and returns", "Churn features; customer-item baskets; association rules; repeat-purchase analysis"),
    ("Customer summary and segment assignments", "Already used", "RFM, tenure, purchase gaps, engagement, return rate and segment", "Strong starting features for churn; segment-aware recommendations and retention actions"),
    ("Application sales and sales lines", "Already used", "Tenant, store, seller, customer, SKU, quantity, amount, status and date", "Tenant-specific churn history, basket building, cross-sell evidence and sales anomalies"),
    ("Product and inventory records", "Already used", "SKU, category, availability, stock, reorder level and store", "Remove unavailable products; stock-aware recommendations; inventory anomalies"),
    ("Forecast outputs and actuals", "Already used", "Actual, predicted, bounds, residual, model version and horizon", "Detect unusual revenue/demand deviations and support model monitoring"),
    ("Customer engagement events", "Add for M3", "Visit/contact/campaign timestamps, channel, outcome and consent", "Reliable churn labels, engagement trends and recommendation feedback"),
    ("Recommendation feedback", "Add for M3", "Shown, clicked, accepted, rejected, purchased and timestamp", "Offline/online evaluation and later personalization"),
    ("Operational telemetry", "Add for M4", "API latency/errors, audit events, model runs, drift and job status", "Deployment health, incident response and retraining decisions"),
]
story.append(
    table(
        ["Dataset", "Status", "Important fields", "How MarketMind uses it"],
        dataset_rows,
        [37 * mm, 23 * mm, 53 * mm, 59 * mm],
        6.8,
    )
)
story.extend(
    [
        Spacer(1, 4 * mm),
        P("Data rules that prevent misleading AI", "H2x"),
        bullets(
            [
                "Use stable tenant, store, customer, transaction and product identifiers; never guess cross-dataset mappings.",
                "Build churn labels from a documented observation window and a later inactivity window; do not use future information in training features.",
                "Keep returns, voids, unavailable products and stockouts explicit so models do not learn false demand or revenue.",
                "If consent, history or interaction density is insufficient, return a not-ready state and an exact data requirement.",
                "Keep full generated artifacts outside Git; version code, schemas, deterministic samples and aggregate reports.",
            ]
        ),
        PageBreak(),
    ]
)

# Models
story.extend(
    [
        P("3. Model plan and compatibility", "H1x"),
        P(
            "Every new model is designed to reuse the current preprocessing, model-run metadata, database "
            "imports, FastAPI scopes and React report patterns.",
        ),
    ]
)
model_rows = [
    ("Customer segmentation", "Continue", "K-Means primary; Hierarchical comparator", "Supplies RFM/engagement groups and segment history to churn and recommendations", "Silhouette, Davies-Bouldin, stability, useful profiles"),
    ("Revenue and demand forecasting", "Continue", "Seasonal Naive, Linear Trend/Prophet, XGBoost, Random Forest", "Forecast residuals become anomaly signals; demand remains linked to inventory", "MAE, RMSE, bias, baseline improvement, matured accuracy"),
    ("Churn prediction", "New in M3", "Logistic Regression baseline; Random Forest and XGBoost candidates", "Tabular customer features already exist; chronological labels and calibration must be added", "Recall, precision, F1, PR-AUC, ROC-AUC, calibration and slice checks"),
    ("Product recommendation", "New in M3", "Association rules first; popularity/category fallback; item-based CF or implicit ALS when data is dense", "Invoice-product baskets and SKU records already exist; availability filtering uses inventory", "Precision@K, Recall@K, coverage, diversity and reviewed conversion"),
    ("Anomaly detection", "New in M3", "Business thresholds and robust statistics first; Isolation Forest candidate", "Current alerts, forecast residuals, sales lines and inventory data provide evidence", "Reviewed precision, detection rate, false-positive workload and time to resolve"),
]
story.append(
    table(
        ["Capability", "Decision", "Model", "Why compatible", "Acceptance evidence"],
        model_rows,
        [29 * mm, 20 * mm, 43 * mm, 48 * mm, 42 * mm],
        6.55,
    )
)
story.extend(
    [
        Spacer(1, 4 * mm),
        callout(
            "Model selection rule",
            "A complex model is selected only when it beats the approved baseline on unseen, time-ordered "
            "data and remains understandable at the permitted user scope. Otherwise MarketMind keeps the "
            "baseline, displays the limitation and records the failed candidate for review.",
            TEAL,
        ),
        P("Cold-start behavior", "H2x"),
        bullets(
            [
                "New business: show onboarding readiness and data requirements; do not copy demo predictions.",
                "New customer: use safe popularity/category suggestions until purchase history is sufficient.",
                "Sparse churn history: show rule-based inactivity status, not an invented probability.",
                "Unmapped product or store: keep mapping_status as unmapped and stock risk as unknown.",
            ]
        ),
        PageBreak(),
    ]
)

# Integration
story.extend(
    [
        P("4. Application integration", "H1x"),
        P(
            "Milestone 3 extends the existing architecture; the frontend never reads a model artifact or the "
            "database directly.",
        ),
        flow_row(["React role view", "FastAPI + RBAC", "Model service", "SQLAlchemy", "Versioned records"]),
        Spacer(1, 4 * mm),
    ]
)
api_rows = [
    ("Churn", "GET /api/v1/churn/summary<br/>GET /api/v1/churn/customers<br/>POST /api/v1/churn/train", "Summary, scoped risk list, drivers, model metadata and not-ready reason"),
    ("Recommendations", "GET /api/v1/recommendations/customer/{id}<br/>GET /api/v1/recommendations/product/{id}<br/>POST /api/v1/recommendations/feedback", "Ranked eligible products, reason, score, model/rule version and feedback receipt"),
    ("Anomalies", "GET /api/v1/anomalies<br/>PATCH /api/v1/anomalies/{id}<br/>POST /api/v1/anomalies/train", "Evidence, severity, status, scope, assignee, detector version and resolution notes"),
    ("Monitoring", "GET /api/v1/models/monitoring<br/>GET /api/v1/models/{id}/runs", "Readiness, quality, drift, errors, last run and approved/active state"),
]
story.append(table(["Module", "Proposed API group", "Response responsibility"], api_rows, [31 * mm, 66 * mm, 75 * mm], 6.9))
story.extend([Spacer(1, 4 * mm), P("Role access carried forward", "H2x")])
role_rows = [
    ("Business Owner", "Tenant churn summary and permitted customers", "Business/customer recommendations", "Tenant sales and stock alerts", "No model configuration"),
    ("Store Manager", "Assigned-store view", "Store/customer/product recommendations", "Assigned-store alerts and workflow", "No user or model administration"),
    ("Sales Executive", "No churn report", "Assigned-customer recommendations only", "Only alerts tied to own work if permitted", "No inventory/model controls"),
    ("Administrator", "All permitted scopes with MFA", "Configure, monitor and audit", "Configure detectors and audit response", "Internal platform account only"),
]
story.append(table(["Role", "Churn", "Recommendations", "Anomalies", "Restriction"], role_rows, [29 * mm, 39 * mm, 43 * mm, 38 * mm, 33 * mm], 6.55))
story.extend(
    [
        Spacer(1, 4 * mm),
        P("Database additions", "H2x"),
        bullets(
            [
                "churn_model_runs and churn_predictions with label policy, probability, band, drivers and scope",
                "recommendation_model_runs, recommendation_results and recommendation_feedback with eligibility evidence",
                "anomaly_model_runs, anomaly_events and anomaly_actions with severity, state, assignee and audit trail",
                "shared model status, version, feature schema, metrics, approval, active flag and generated-at fields",
            ]
        ),
        PageBreak(),
    ]
)

# M4 workflow
story.extend(
    [
        P("5. Milestone 4 workflow", "H1x"),
        P(
            "Goal: turn the integrated local application into a tested, observable and recoverable release. "
            "Milestone 4 continues all approved models; it does not introduce a separate business model.",
        ),
    ]
)
m4_rows = [
    ("1", "Freeze release scope", "Tag approved requirements, API schemas, database migrations, model versions and known limitations."),
    ("2", "Run clean-install tests", "Create an empty PostgreSQL database, apply every Alembic migration, seed roles, import data twice and verify no duplicates."),
    ("3", "Functional and role testing", "Test onboarding, sales, inventory, profiles, settings, segmentation, forecasts, churn, recommendations and anomaly workflows for all four roles."),
    ("4", "Model validation", "Reproduce features and artifacts, check leakage, baseline comparison, slices, calibration, false alerts, rollback and actual-vs-predicted monitoring."),
    ("5", "Security and privacy", "Test authentication, MFA, session revocation, tenant isolation, uploads, rate limits, secrets, audit coverage and PII minimization."),
    ("6", "UX, accessibility and performance", "Check responsive screens, keyboard access, contrast, empty/error/loading states, API latency, imports and concurrent jobs."),
    ("7", "Container and staging release", "Build Docker images, run FastAPI with PostgreSQL, apply migrations automatically, configure HTTPS/secrets and perform smoke tests."),
    ("8", "Operations and recovery", "Enable logs, health checks, alerts, backups, restore rehearsal, model rollback, application rollback and incident runbooks."),
    ("9", "UAT and final handover", "Run role-based demo scenarios, record acceptance, publish documentation and release only after the rollback plan is proven."),
]
story.append(table(["Step", "Workstream", "Completion evidence"], m4_rows, [13 * mm, 48 * mm, 111 * mm], 7.15))
story.extend(
    [
        Spacer(1, 4 * mm),
        callout(
            "Recommended deployment path",
            "Dockerized FastAPI + PostgreSQL in staging first, then an approved cloud target such as Render "
            "or Railway. Keep frontend and backend environment values separate, run migrations before smoke "
            "tests, and retain the previous application and model versions for rollback.",
            BLUE,
        ),
        PageBreak(),
    ]
)

# Priority and gates
story.extend(
    [
        P("6. Priority, ownership and completion gates", "H1x"),
        P("Suggested task order for the team", "H2x"),
    ]
)
priority_rows = [
    ("P0", "Data and product decisions", "Churn policy, consent, event schema, baskets, anomaly severity and success metrics", "Blocks trustworthy training"),
    ("P1", "Data pipeline", "Validation, point-in-time features, interaction density, lineage and quality reports", "Blocks all three M3 models"),
    ("P2", "Models", "Baselines, candidates, chronological evaluation, model cards and safe fallbacks", "Produces approved artifacts"),
    ("P3", "Backend/database", "Migrations, imports, APIs, RBAC, audit, jobs and model lifecycle", "Makes outputs usable and secure"),
    ("P4", "Frontend", "Role pages, filters, explanations, feedback, alerts and not-ready states", "Makes results understandable"),
    ("P5", "Integration and QA", "Clean install, repeat imports, role tests, model tests and end-to-end demo", "Completes Milestone 3"),
    ("P6", "Deployment hardening", "Security, accessibility, load, monitoring, backups, UAT and rollback", "Completes Milestone 4"),
]
story.append(table(["Priority", "Area", "Main work", "Why now"], priority_rows, [17 * mm, 37 * mm, 89 * mm, 39 * mm], 6.9))
story.extend([Spacer(1, 4 * mm), P("Definition of done", "H2x")])
done_rows = [
    ("Milestone 3", "Three modules use real tenant data; baselines and candidates are documented; versioned results reach role-scoped APIs and dashboards; low-data states show no fake predictions; automated model/API/RBAC tests pass."),
    ("Milestone 4", "Clean PostgreSQL install passes; all four role journeys pass; no unresolved critical/high security issue; load and accessibility targets are accepted; monitoring, backup/restore and rollback are demonstrated; UAT and release documents are signed."),
]
story.append(table(["Milestone", "Release gate"], done_rows, [31 * mm, 151 * mm], 7.3))
story.extend(
    [
        Spacer(1, 5 * mm),
        callout(
            "What continues from the current project",
            "FastAPI routing, Pydantic validation, SQLAlchemy/Alembic, JWT + MFA, backend RBAC and data scope, "
            "onboarding imports, React role dashboards, customer features, K-Means segmentation, forecasting, "
            "model metadata, tests and Docker/PostgreSQL configuration. New work should extend these patterns, "
            "not create a separate AI application.",
            PURPLE,
        ),
        Spacer(1, 4 * mm),
        P(
            "Prepared from the MarketMind project brief, SRS v1.1 and the current Garvitk001/Review implementation.",
            "Smallx",
        ),
    ]
)

doc.build(story)
print(OUTPUT)
