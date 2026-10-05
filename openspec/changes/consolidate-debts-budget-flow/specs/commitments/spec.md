## REMOVED Requirements

### Requirement: Compromisos screen and manual commitment tracking
**Reason**: Compromisos required the user to manually create a separate entity and click "Apartar esta quincena"/"reiniciar" to track saving toward a periodic bill — duplicating information a recurring debt already has (its amount and how often it's due). Automatic, debt-driven reserve accrual (`debt-reserves`) replaces it without any manual bookkeeping.
**Migration**: No replacement screen; the new "Apartados" screen (capability `debt-reserves`) shows the same kind of progress automatically for every recurring parent/standalone debt. Any existing `commitments` data is dropped; users recreate the equivalent by marking the relevant debt as recurring with the right periodicity and a starting reserve amount.
