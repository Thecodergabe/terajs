/**
 * A node in the reactive dependency graph.
 * Represents a single reactive primitive.
 */
export interface DependencyNode {
  /** Reactive identity (RID), e.g. "Counter#1.ref#1". */
  rid: string;
  /** RIDs this node depends on (reads from). */
  dependsOn: Set<string>;
  /** RIDs that depend on this node (are affected when it changes). */
  dependents: Set<string>;
}
