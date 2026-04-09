import { db } from '@/firebase';
import { 
  doc, 
  setDoc, 
  addDoc, 
  collection, 
  serverTimestamp, 
  updateDoc, 
  getDoc 
} from 'firebase/firestore';

export function calculateStayReadiness(
  inventory_health: number,
  cleaning_score: number,
  linen_score: number,
  maintenance_score: number,
  audit_score: number,
  stock_days: number,
  lead_time: number
): number {
  return (
    0.25 * inventory_health +
    0.20 * cleaning_score +
    0.20 * linen_score +
    0.15 * maintenance_score +
    0.10 * (audit_score * 20) +
    0.10 * (stock_days / (lead_time || 1) * 10)
  );
}

export function determineRiskLevel(sr: number, stock_days: number, lead_time: number): string {
  if (sr < 60) return 'CRITICAL';
  if (sr < 75) return 'HIGH';
  if (stock_days < lead_time) return 'STOCKOUT';
  return 'LOW';
}

export async function processMetricsUpdate(propertyId: string, metrics: any) {
  const sr = calculateStayReadiness(
    metrics.inventory_health,
    metrics.cleaning_score,
    metrics.linen_score,
    metrics.maintenance_score,
    metrics.audit_score,
    metrics.stock_days,
    metrics.lead_time
  );

  const riskLevel = determineRiskLevel(sr, metrics.stock_days, metrics.lead_time);

  // Update Prediction
  await setDoc(doc(db, 'predictions', propertyId), {
    property_id: propertyId,
    stay_readiness: sr,
    risk_level: riskLevel,
    updated_at: serverTimestamp(),
  }, { merge: true });

  // Automation Engine
  // Restock
  if (metrics.stock_days < metrics.lead_time && !metrics.restock_flag) {
    await addDoc(collection(db, 'orders'), {
      property_id: propertyId,
      item: 'Auto Restock - Linen & Supplies',
      quantity: 1,
      status: 'pending',
      created_at: serverTimestamp(),
    });
    // Note: In a real app, we'd update the metric flag here too, 
    // but since we're in a stateless function, we'd need to update the metric document.
  }

  // Cleaning
  if (metrics.cleaning_score < 80 && !metrics.cleaning_flag) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    await addDoc(collection(db, 'cleaning_tasks'), {
      property_id: propertyId,
      task_date: tomorrow.toISOString().split('T')[0],
      status: 'scheduled',
      created_at: serverTimestamp(),
    });
  }

  // Maintenance
  if (metrics.maintenance_score < 70 && !metrics.maintenance_flag) {
    await addDoc(collection(db, 'maintenance_tasks'), {
      property_id: propertyId,
      issue: 'Auto-detected issue',
      priority: 'high',
      status: 'open',
      created_at: serverTimestamp(),
    });
  }
}
