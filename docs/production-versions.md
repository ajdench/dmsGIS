# Production Versions

This document records named production baselines for the shipped app.

## Version 1

- Git tag: `production-v1`
- Baseline commit: `194f628`
- Meaning:
  the first saved production baseline after the initial production hardening, saved-view foundation, scenario/config consolidation, and typed facility-filter rollout

## Version 2

- Status: in progress
- Starting point:
  Version 2 development begins from the `production-v1` baseline
- Meaning:
  the next production iteration after Version 1

Working rule:

- treat `production-v1` as the recovery and reference point for the first stable production baseline
- treat all new production development after that baseline as Version 2 work until a new baseline is explicitly named
