import { Router } from "express";
import {
  testPrintToThermalPrinter,
  printToThermalPrinterCetakBillCustomer,
  printHelperNote,
  printToThermalPrinterCetakKwitansi,
} from "../utils/printerUtil.js";

const router = Router();

//test config
router.post("/printTest", async (req, res) => {
  const { printerIp, printerPort, printerModel } = req.body;
  console.log({ printerIp, printerPort, printerModel });
  if (!printerIp) {
    return res.status(400).json({ message: "Printer IP tidak diberikan" });
  }
  if (!printerPort) {
    return res.status(400).json({ message: "Printer port tidak diberikan" });
  }
  if (!printerModel) {
    return res
      .status(400)
      .json({ message: "items untuk dicetak tidak diberikan" });
  }

  try {
    const result = await testPrintToThermalPrinter({
      ip: printerIp,
      port: printerPort,
      printerModel: printerModel?.toUpperCase(),
    });
    if (result) {
      return res.json({ message: "Test Berhasil" });
    } else {
      return res
        .status(400)
        .json({ message: "Gagal mencetak", error: "printer tidak terhubung" });
    }
  } catch (error) {
    console.log(error);
    return res
      .status(400)
      .json({ message: "Gagal mencetak", error: error?.message });
  }
});

//untuk customer sebelum bayar
router.post("/printCetakBillCustomer", async (req, res) => {
  const { config, bill, time } = req.body;

  if (!config?.ipPrinter) {
    return res.status(400).json({ message: "Printer IP tidak diberikan" });
  }
  if (!config?.portPrinter) {
    return res.status(400).json({ message: "Printer port tidak diberikan" });
  }
  if (!config?.tipePrinter) {
    return res.status(400).json({ message: "Printer port tidak diberikan" });
  }

  if (!bill) {
    return res
      .status(400)
      .json({ message: "bill untuk dicetak tidak diberikan" });
  }

  //cek bill
  if (!bill?.currentBill) {
    return res.status(400).json({ message: "Tidak ada current bill" });
  }

  try {
    const isSuccess = await printToThermalPrinterCetakBillCustomer({
      ip: config?.ipPrinter,
      port: config?.portPrinter,
      printerModel: config?.tipePrinter,
      diskons: bill?.diskons,
      promos: bill?.promos,
      futureVouchers: bill?.futureVouchers,
      subtotal: bill?.subTotal,
      total: bill?.total,
      currentBill: bill?.currentBill,
      id: bill?.id,
      customerName: bill?.customerName,
      spg: bill?.spg,
      salesPerson: bill?.salesPerson,
      paymentMethod: bill?.paymentMethod,
      customerName: bill?.customerName,
      customerEmail: bill?.customerEmail,
      time,
      kodeInvoice: bill?.kodeInvoice,
    });

    if (isSuccess) {
      return res.json({ message: "Berhasil mencetak bill customer" });
    } else {
      return res.status(400).json({ message: "printer tidak terhubug" });
    }
  } catch (error) {
    return res.status(400).json({ message: "Gagal mencetak bill customer" });
  }
});

//untuk customer setelah bayar (pilihan mesin),
//paymentMachine melitputi :
//EDC BCA, Transfer, Qris, LinkAja, Dana, Ovo,Grabfood, ShopeeFood
//note: jangan ubah apa apa database, hanya pakai sinkronisasi
router.post("/printCetakKuitansi", async (req, res) => {
  const { config, bill, time } = req.body;

  if (!config?.ipPrinter) {
    return res.status(400).json({ message: "Printer IP tidak diberikan" });
  }
  if (!config?.portPrinter) {
    return res.status(400).json({ message: "Printer port tidak diberikan" });
  }
  if (!config?.tipePrinter) {
    return res.status(400).json({ message: "Printer port tidak diberikan" });
  }

  if (!bill) {
    return res
      .status(400)
      .json({ message: "bill untuk dicetak tidak diberikan" });
  }

  //cek bill
  if (!bill?.currentBill) {
    return res.status(400).json({ message: "Tidak ada current bill" });
  }

  try {
    const isSuccess = await printToThermalPrinterCetakKwitansi({
      ip: config?.ipPrinter,
      port: config?.portPrinter,
      printerModel: config?.tipePrinter,
      diskons: bill?.diskons,
      promos: bill?.promos,
      futureVouchers: bill?.futureVouchers,
      subtotal: bill?.subTotal,
      total: bill?.total,
      currentBill: bill?.currentBill,
      id: bill?.id,
      customerName: bill?.customerName,
      spg: bill?.spg,
      salesPerson: bill?.salesPerson,
      paymentMethod: bill?.paymentMethod,
      customerName: bill?.customerName,
      customerEmail: bill?.customerEmail,
      time,
      kodeInvoice: bill?.kodeInvoice,
    });

    if (isSuccess) {
      return res.json({ message: "Berhasil mencetak bill customer" });
    } else {
      return res.status(400).json({ message: "printer tidak terhubug" });
    }
  } catch (error) {
    return res.status(400).json({ message: "Gagal mencetak bill customer" });
  }
});

//untuk helper
router.post("/printSimpanBill", async (req, res) => {
  const { printerIp, printerPort, printerModel, items, catatans, time } =
    req.body;
  if (!printerIp) {
    return res.status(400).json({ message: "Printer IP tidak diberikan" });
  }
  if (!printerPort) {
    return res.status(400).json({ message: "Printer port tidak diberikan" });
  }
  if (!printerModel) {
    return res.status(400).json({ message: "Printer model tidak diberikan" });
  }
  if (!items) {
    return res
      .status(400)
      .json({ message: "items untuk dicetak tidak diberikan" });
  }

  try {
    const isSuccess = await printHelperNote({
      ip: printerIp,
      port: printerPort,
      items: items,
      printerModel,
      catatans,
      time,
    });
    if (isSuccess) {
      return res.json({ message: "Berhasil mencetak" });
    } else {
      return res.status(400).json({ message: "Printer tidak terhubung" });
    }
  } catch (error) {
    console.log("gagal mencetak", error);
    return res.status(400).json({ message: "Gagal mencetak", error: error });
  }
});

export default router;
