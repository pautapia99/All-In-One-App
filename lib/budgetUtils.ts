/** Preset swatches offered when creating/editing a budget category. */
export const CATEGORY_COLORS = [
  '#ef4444', // rojo
  '#f97316', // naranja
  '#eab308', // amarillo
  '#22c55e', // verde
  '#06b6d4', // cian
  '#3b82f6', // azul
  '#8b5cf6', // violeta
  '#ec4899', // rosa
];

export function formatEuro(amount: number): string {
  return `${amount.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}€`;
}
