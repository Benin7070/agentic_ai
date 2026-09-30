---
name: agent-evaluation
description: >-
  Frameworks for evaluating agent reliability, decision quality, routing
  effectiveness, and fairness in the Credit Decisioning MAS.
---

# Agent Evaluation — Credit Decisioning MAS

## Overview

This skill defines how to systematically evaluate the MAS beyond "does the code
run?" — focusing on whether agents make good credit decisions, whether routing
adapts correctly to risk, whether memory improves decisions over time, and whether
the system is fair across demographic groups.

---

## Evaluation Dimensions

### 1. Individual Agent Quality

| Agent | Key Metric | How to Measure |
|:------|:-----------|:---------------|
| KYC Agent | Verification accuracy | % of correct identity verifications on labeled test set |
| Fraud Agent | Precision & Recall | Precision (don't flag good customers), Recall (catch actual fraud) |
| Credit Agent | Creditworthiness accuracy | Correlation between agent assessment and actual default rates |
| Affordability Agent | DTI accuracy | Compare computed DTI with ground truth from dataset |
| Pricing Agent | Rate appropriateness | Compare offered rates with risk-adjusted benchmarks |
| Policy Guard | Constraint compliance | 100% of decisions must pass policy rules (zero tolerance) |
| Explainability Agent | Explanation quality | Human evaluation: are explanations clear, complete, accurate? |

### 2. Routing Effectiveness (Innovation #1)

Evaluate whether Risk-Aware Routing actually improves decisions:

| Metric | Description |
|:-------|:-----------|
| **Routing accuracy** | Do low-risk apps actually get fast-tracked? Do high-risk apps get thorough review? |
| **Agent skip rate** | % of applications where agents are appropriately skipped |
| **Escalation rate** | % of applications escalated to human review (should be moderate, not excessive) |
| **Pipeline latency** | Low-risk pipeline should be significantly faster than high-risk |
| **A/B comparison** | Compare risk-aware routing vs. fixed pipeline on same test set |

### 3. Memory Effectiveness (Innovation #2)

Evaluate whether G-Memory improves decisions over time:

| Metric | Description |
|:-------|:-----------|
| **Retrieval relevance** | Are retrieved similar applications actually similar? (cosine similarity) |
| **Decision improvement** | Do decisions improve after outcome feedback is stored? |
| **Learning curve** | Plot decision quality vs. number of outcomes stored |
| **Insight quality** | Are distilled insights actually predictive of outcomes? |
| **Cold start** | How does the system perform with empty memory vs. populated memory? |

### 4. End-to-End Decision Quality

| Metric | Description |
|:-------|:-----------|
| **Accuracy** | % of correct approve/reject decisions (vs. actual loan outcomes) |
| **Default rate** | % of approved loans that actually defaulted |
| **Rejection rate** | % of applications rejected (should be reasonable, not over-conservative) |
| **Offer quality** | How close are offered limits to optimal amounts? |
| **Confidence calibration** | When system says 0.86 confidence, is it right ~86% of the time? |

---

## Fairness Evaluation

Since this is a financial system, fairness is critical:

### Protected Attributes
- Age, gender, income bracket, employment type, geographic region.

### Fairness Metrics
| Metric | Definition |
|:-------|:-----------|
| **Demographic parity** | Approval rates should be similar across demographic groups |
| **Equal opportunity** | True positive rates (correctly approving good loans) should be equal |
| **Predictive parity** | Among approved applicants, default rates should be similar |
| **Disparate impact ratio** | Approval rate of disadvantaged group / advantaged group ≥ 0.8 |

### How to Test
```python
# Fairness evaluation pseudocode
def evaluate_fairness(decisions, protected_attribute):
    groups = group_by(decisions, protected_attribute)
    
    for group_name, group_decisions in groups.items():
        approval_rate = count(approved) / count(total)
        default_rate = count(defaulted) / count(approved)
        true_positive_rate = count(correctly_approved) / count(actually_good)
        
        print(f"{group_name}: approval={approval_rate:.2%}, "
              f"default={default_rate:.2%}, TPR={true_positive_rate:.2%}")
    
    # Disparate impact ratio
    min_approval = min(approval_rates)
    max_approval = max(approval_rates)
    di_ratio = min_approval / max_approval
    assert di_ratio >= 0.8, f"Disparate impact: {di_ratio:.2f}"
```

---

## Evaluation Test Sets

### Test Set Structure
| Test Category | Purpose | Size |
|:-------------|:--------|:-----|
| **Low-risk baseline** | Should be approved quickly with minimal agents | 100+ applications |
| **High-risk boundary** | Should trigger full pipeline and careful review | 100+ applications |
| **Clear rejects** | Should be rejected with clear reasoning | 50+ applications |
| **Edge cases** | Borderline applications that test nuanced decisions | 50+ applications |
| **Adversarial** | Designed to fool specific agents (e.g., synthetic fraud) | 30+ applications |
| **Fairness set** | Balanced across demographics for fairness testing | 200+ applications |

### Test Application Archetypes
```
Archetype 1: "Safe Salaried"
  Income: ₹1,20,000 | Score: 780 | Amount: ₹30,000 | DTI: 0.15
  Expected: APPROVE, fast pipeline, skip fraud

Archetype 2: "High-Risk New Credit"
  Income: ₹35,000 | Score: 580 | Amount: ₹2,00,000 | DTI: 0.65
  Expected: REJECT or heavily conditional, full pipeline

Archetype 3: "Moderate with History"
  Income: ₹65,000 | Score: 710 | Amount: ₹75,000 | DTI: 0.35
  Expected: APPROVE with reduced limit (~₹60K), medium pipeline

Archetype 4: "Good Score, Fraud Signals"
  Income: ₹90,000 | Score: 750 | Amount: ₹50,000 | Unusual transactions
  Expected: APPROVE only after fraud agent clears, full fraud check
```

---

## Evaluation Pipeline

```
1. Load test set
        ↓
2. Run each application through MAS
        ↓
3. Collect: decision, routing path, agent traces, confidence
        ↓
4. Compare against ground truth (actual outcomes in dataset)
        ↓
5. Compute metrics:
   - Per-agent accuracy
   - Routing effectiveness
   - Decision quality
   - Fairness metrics
        ↓
6. Generate evaluation report
        ↓
7. Compare with baseline (fixed pipeline, no memory)
```

---

## Baseline Comparisons

To demonstrate value, compare the MAS against:

| Baseline | Description |
|:---------|:-----------|
| **Fixed pipeline** | All agents run in fixed order for every application (no risk-aware routing) |
| **No memory** | Same routing but without G-Memory context (cold decisions) |
| **Single model** | Traditional single ML model for approve/reject |
| **Rule-based** | Hard-coded business rules (score > 700 → approve) |

Your system should outperform these baselines on at least decision quality
and explainability, while being comparable on speed for low-risk applications.

---

## Reporting

Evaluation results should be presented as:
1. **Metrics table** — all key metrics in a single summary table.
2. **Confusion matrix** — for approve/reject decisions.
3. **Risk routing visualization** — show how different risk levels got different pipelines.
4. **Memory learning curve** — decision quality vs. memory population.
5. **Fairness dashboard** — demographic parity and disparate impact ratios.
