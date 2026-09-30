# NarrativeLine test fixtures

These are application-owned test inputs. The 0.2.0 consumer Dataset and the
localized four-Event projection pair are minimal NarrativeLine fixtures. The
0.1.0 fixture is copied from the published E2R-SPEC example at
`ffb9fe74e4694fd17c11202daa64752e1955af88`. These inputs keep consumer tests
independent of unpublished sibling checkouts. Their paths and identities are
not cross-repository fixture contracts, canonical samples, or public Dataset
authorities.

The acceptance remains semantic: NarrativeLine must preserve supported and
unknown Relative Time information on import/edit/export, keep unsupported
versions opaque, avoid inventing declarations, and render the expected
projection for the supplied input. Keep these fixtures version-controlled
with the application tests so `npm test` has the same inputs in local runs and
GitHub Actions. Changes to E2R semantics still require the relevant
specification and Validator authority; this folder does not define them.
