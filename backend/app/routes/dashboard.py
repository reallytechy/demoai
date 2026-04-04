"""
Dashboard endpoints — aggregated financial overview.
Uses the sample data for demo mode.
"""

from fastapi import APIRouter

from app.agents._sample_data import get_sample_financial_context
from app.agents.tools import (
    analyze_budget,
    calculate_debt_to_income,
    simulate_payoff,
)

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/overview")
async def overview():
    """Financial overview: score, debts, income, expenses."""
    ctx = get_sample_financial_context()
    profile = ctx["profile"]
    debts = ctx["debts"]

    total_debt = sum(d.get("balance", 0) for d in debts)
    total_overdue = sum(d.get("overdue_amount", 0) for d in debts)
    total_min_payments = sum(d.get("min_payment", 0) for d in debts)

    return {
        "credit_score": profile.get("credit_score", 0),
        "credit_score_band": profile.get("credit_score_band", "Unknown"),
        "total_debt": total_debt,
        "total_overdue": total_overdue,
        "monthly_income": profile.get("monthly_income", 0),
        "monthly_expenses": profile.get("monthly_expenses", 0),
        "total_min_payments": round(total_min_payments, 2),
        "debt_count": len(debts),
        "active_accounts": profile.get("active_accounts", 0),
        "risk_flags": profile.get("risk_flags", []),
        "positive_factors": profile.get("positive_factors", []),
    }


@router.get("/debt-breakdown")
async def debt_breakdown():
    """Debt broken down by account with details."""
    ctx = get_sample_financial_context()
    debts = ctx["debts"]
    profile = ctx["profile"]

    # Calculate DTI
    total_min = sum(d.get("min_payment", 0) for d in debts)
    income = profile.get("monthly_income", 50000)
    dti = calculate_debt_to_income.invoke({
        "monthly_income": income,
        "total_monthly_debt_payments": total_min,
    })

    return {
        "debts": debts,
        "dti": dti,
    }


@router.get("/payoff-plan")
async def payoff_plan():
    """Compare avalanche vs snowball payoff strategies."""
    ctx = get_sample_financial_context()
    debts = ctx["debts"]

    # Filter to active debts with positive balance
    payable = [d for d in debts if d.get("balance", 0) > 0 and d.get("status") != "Written-off"]

    if not payable:
        return {"message": "No active debts to create a payoff plan for.", "strategies": []}

    avalanche = simulate_payoff.invoke({
        "debts": payable,
        "strategy": "avalanche",
        "extra_monthly_payment": 5000,
    })
    snowball = simulate_payoff.invoke({
        "debts": payable,
        "strategy": "snowball",
        "extra_monthly_payment": 5000,
    })

    return {
        "extra_monthly_payment": 5000,
        "strategies": [avalanche, snowball],
        "recommendation": "avalanche" if avalanche["total_interest"] <= snowball["total_interest"] else "snowball",
    }


@router.get("/budget-analysis")
async def budget_analysis():
    """Budget analysis against 50/30/20 benchmarks."""
    ctx = get_sample_financial_context()
    profile = ctx["profile"]
    income = profile.get("monthly_income", 50000)

    # Demo expense categories
    expenses = {
        "Rent": 12000,
        "Groceries": 5000,
        "Transport": 3000,
        "Utilities": 2000,
        "EMI": sum(d.get("min_payment", 0) for d in ctx["debts"]),
        "Entertainment": 3000,
        "Shopping": 2000,
        "Dining": 2000,
        "Insurance": 1500,
        "Subscriptions": 500,
    }

    result = analyze_budget.invoke({
        "monthly_income": income,
        "expenses": expenses,
    })

    return result


@router.get("/insights")
async def insights():
    """AI-generated financial insights (pre-computed for demo)."""
    ctx = get_sample_financial_context()
    profile = ctx["profile"]
    debts = ctx["debts"]

    insights_list = []

    # Credit score insight
    score = profile.get("credit_score", 0)
    if score < 600:
        insights_list.append({
            "type": "warning",
            "title": "Low Credit Score",
            "description": f"Your credit score of {score} ({profile.get('credit_score_band')}) needs urgent attention. Focus on clearing overdue payments and reducing credit utilization.",
        })

    # Utilization insight
    util = profile.get("credit_utilization", {})
    if util.get("utilization_percent", 0) > 75:
        insights_list.append({
            "type": "warning",
            "title": "High Credit Utilization",
            "description": f"Credit utilization at {util.get('utilization_percent')}% is very high. Aim to bring it below 30% to improve your score significantly.",
        })

    # Written-off accounts
    written_off = [d for d in debts if d.get("status") == "Written-off"]
    if written_off:
        insights_list.append({
            "type": "critical",
            "title": "Written-Off Account",
            "description": f"You have {len(written_off)} written-off account(s). Contact the lender to negotiate a settlement — this is the #1 factor hurting your score.",
        })

    # Positive factors
    for factor in profile.get("positive_factors", []):
        insights_list.append({
            "type": "positive",
            "title": "Positive Signal",
            "description": factor,
        })

    # Savings potential
    income = profile.get("monthly_income", 0)
    expenses = profile.get("monthly_expenses", 0)
    if income > expenses:
        savings = income - expenses
        insights_list.append({
            "type": "tip",
            "title": "Savings Opportunity",
            "description": f"You have ~{savings:,.0f}/month surplus. Consider allocating 50% to debt payoff and 50% to an emergency fund.",
        })

    return {"insights": insights_list}
