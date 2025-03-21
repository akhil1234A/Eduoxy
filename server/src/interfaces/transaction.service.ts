import { ITransaction } from "../models/transaction.model";

export interface ITransactionService {
  createTransaction(
    userId: string,
    courseId: string,
    transactionId: string,
    amount: number,
    paymentProvider: "stripe"
  ): Promise<ITransaction>;
  getAdminEarnings(): Promise<any[]>;  
  getTeacherEarnings(teacherId: string): Promise<any[]>;
  getStudentPurchases(userId: string): Promise<any[]>; 
}