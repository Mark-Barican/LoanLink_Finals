# Philippine Loan Calculation Method

This document explains the loan calculation method implemented in the LoanLink system, which follows the **Philippine Add-On Interest Method** as used by financial institutions in the Philippines.

## Calculation Method

### Philippine Add-On Interest Method

The system uses the **Add-On Interest Method**, which is the standard calculation method used by Philippine financial institutions like RFC (Radiowealth Finance Company) and other lending companies.

#### Formula

```
Total Interest = Principal × Interest Rate × Loan Term (in years)
Total Amount = Principal + Total Interest
Monthly Payment = Total Amount ÷ Number of Months
```

#### Example

For a loan with:
- **Principal**: ₱100,000
- **Interest Rate**: 12% per annum
- **Term**: 12 months (1 year)

**Calculation:**
1. Total Interest = ₱100,000 × 12% × 1 year = ₱12,000
2. Total Amount = ₱100,000 + ₱12,000 = ₱112,000
3. Monthly Payment = ₱112,000 ÷ 12 months = ₱9,333.33

## Key Features

### 1. Fixed Monthly Payments
- All monthly payments are equal throughout the loan term
- Interest is calculated upfront and distributed evenly
- No diminishing balance calculation

### 2. Transparent Calculation
- Total interest is clearly displayed
- Total amount to be repaid is shown
- Monthly payment amount is fixed

### 3. Philippine Standard
- Follows the same method used by Philippine banks and lending institutions
- Compliant with Philippine financial regulations
- Easy to understand for Filipino borrowers

## Database Schema

The system stores the calculated values in the `loans` table:

```sql
CREATE TABLE loans (
  id SERIAL PRIMARY KEY,
  company_id INTEGER REFERENCES companies(id),
  code VARCHAR(50) UNIQUE NOT NULL,
  principal DECIMAL(15,2) NOT NULL,
  interest_rate DECIMAL(5,2) NOT NULL,
  term_months INTEGER NOT NULL,
  start_date DATE NOT NULL,
  total_interest DECIMAL(15,2) NOT NULL,  -- Calculated total interest
  total_amount DECIMAL(15,2) NOT NULL,    -- Principal + Total Interest
  status VARCHAR(50) DEFAULT 'active',
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## UI Display

The system displays loan information with:

1. **Principal Amount** - Original loan amount
2. **Total Interest** - Calculated interest (highlighted in orange)
3. **Total Amount** - Principal + Interest (highlighted in green)
4. **Interest Rate** - Annual percentage rate
5. **Term** - Loan duration in months

## Comparison with Other Methods

| Method | Interest Calculation | Monthly Payments | Use Case |
|--------|-------------------|------------------|----------|
| **Philippine Add-On** | Fixed on principal | Equal throughout | Philippine standard |
| Diminishing Balance | On remaining balance | Decreasing | International standard |
| Flat Rate | Fixed monthly | Equal | Rarely used |

## Benefits

1. **Transparency** - Borrowers know exactly how much interest they'll pay
2. **Simplicity** - Easy to understand calculation
3. **Predictability** - Fixed monthly payments
4. **Compliance** - Follows Philippine financial standards
5. **Familiarity** - Same method used by local banks

## Implementation Notes

- The calculation is performed when creating a new loan
- Values are stored in the database for consistency
- UI displays both principal and total amounts clearly
- Reports include both principal and interest amounts
- Migration script updates existing loans with calculated values

## References

- [RFC Loan Calculation Guide](https://rfc.com.ph/blogs/how-to-compute-loan-interest)
- Philippine Lending Company Regulations
- Standard Philippine Banking Practices 