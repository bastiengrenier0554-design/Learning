import type { StructureNode } from '../types';

export function makeId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return 'id-' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export function flattenStructure(
  nodes: StructureNode[],
  depth = 0,
  parentPath: string[] = []
): { node: StructureNode; depth: number; path: string; ancestors: string[] }[] {
  const out: ReturnType<typeof flattenStructure> = [];
  for (const node of nodes) {
    const ancestors = parentPath;
    const path = [...parentPath, node.label].join(' > ');
    out.push({ node, depth, path, ancestors });
    out.push(...flattenStructure(node.children, depth + 1, [...parentPath, node.label]));
  }
  return out;
}

export function walkStructure(
  nodes: StructureNode[],
  visit: (node: StructureNode) => void
): void {
  for (const node of nodes) {
    visit(node);
    walkStructure(node.children, visit);
  }
}

export function mapStructure(
  nodes: StructureNode[],
  map: (node: StructureNode) => StructureNode
): StructureNode[] {
  return nodes.map((node) => ({
    ...map(node),
    children: mapStructure(node.children, map)
  }));
}

export function findNode(nodes: StructureNode[], id: string): StructureNode | undefined {
  for (const node of nodes) {
    if (node.id === id) return node;
    const found = findNode(node.children, id);
    if (found) return found;
  }
  return undefined;
}

export function removeNode(nodes: StructureNode[], id: string): StructureNode[] {
  return nodes
    .filter((node) => node.id !== id)
    .map((node) => ({ ...node, children: removeNode(node.children, id) }));
}

export function descendantIds(node: StructureNode): string[] {
  const ids: string[] = [node.id];
  for (const child of node.children) ids.push(...descendantIds(child));
  return ids;
}
