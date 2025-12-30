export namespace container {
	
	export class ServiceContainer {
	    // Go type: service
	    ProdukService?: any;
	    // Go type: service
	    KategoriService?: any;
	    // Go type: service
	    TransaksiService?: any;
	    // Go type: service
	    PelangganService?: any;
	    // Go type: service
	    PromoService?: any;
	    // Go type: service
	    ReturnService?: any;
	    // Go type: service
	    PrinterService?: any;
	    // Go type: service
	    SettingsService?: any;
	    // Go type: service
	    HardwareService?: any;
	    // Go type: service
	    AnalyticsService?: any;
	    // Go type: service
	    BatchService?: any;
	    // Go type: service
	    UserService?: any;
	    // Go type: service
	    StaffReportService?: any;
	    // Go type: service
	    SalesReportService?: any;
	    // Go type: service
	    DashboardService?: any;
	
	    static createFrom(source: any = {}) {
	        return new ServiceContainer(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.ProdukService = this.convertValues(source["ProdukService"], null);
	        this.KategoriService = this.convertValues(source["KategoriService"], null);
	        this.TransaksiService = this.convertValues(source["TransaksiService"], null);
	        this.PelangganService = this.convertValues(source["PelangganService"], null);
	        this.PromoService = this.convertValues(source["PromoService"], null);
	        this.ReturnService = this.convertValues(source["ReturnService"], null);
	        this.PrinterService = this.convertValues(source["PrinterService"], null);
	        this.SettingsService = this.convertValues(source["SettingsService"], null);
	        this.HardwareService = this.convertValues(source["HardwareService"], null);
	        this.AnalyticsService = this.convertValues(source["AnalyticsService"], null);
	        this.BatchService = this.convertValues(source["BatchService"], null);
	        this.UserService = this.convertValues(source["UserService"], null);
	        this.StaffReportService = this.convertValues(source["StaffReportService"], null);
	        this.SalesReportService = this.convertValues(source["SalesReportService"], null);
	        this.DashboardService = this.convertValues(source["DashboardService"], null);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}

}

export namespace models {
	
	export class AddPoinRequest {
	    pelangganId: number;
	    poin: number;
	
	    static createFrom(source: any = {}) {
	        return new AddPoinRequest(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.pelangganId = source["pelangganId"];
	        this.poin = source["poin"];
	    }
	}
	export class TransaksiItemRequest {
	    produkId: number;
	    jumlah: number;
	    hargaSatuan: number;
	    beratGram: number;
	
	    static createFrom(source: any = {}) {
	        return new TransaksiItemRequest(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.produkId = source["produkId"];
	        this.jumlah = source["jumlah"];
	        this.hargaSatuan = source["hargaSatuan"];
	        this.beratGram = source["beratGram"];
	    }
	}
	export class ApplyPromoRequest {
	    kode: string;
	    subtotal: number;
	    totalQuantity: number;
	    pelangganId: number;
	    items?: TransaksiItemRequest[];
	
	    static createFrom(source: any = {}) {
	        return new ApplyPromoRequest(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.kode = source["kode"];
	        this.subtotal = source["subtotal"];
	        this.totalQuantity = source["totalQuantity"];
	        this.pelangganId = source["pelangganId"];
	        this.items = this.convertValues(source["items"], TransaksiItemRequest);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class Produk {
	    id: number;
	    sku: string;
	    barcode: string;
	    nama: string;
	    kategori: string;
	    berat: number;
	    hargaBeli: number;
	    hargaJual: number;
	    stok: number;
	    satuan: string;
	    jenisProduk: string;
	    kadaluarsa: string;
	    masaSimpanHari: number;
	    tanggalMasuk: string;
	    deskripsi: string;
	    gambar: string;
	    hariPemberitahuanKadaluarsa: number;
	    // Go type: time
	    createdAt: any;
	    // Go type: time
	    updatedAt: any;
	
	    static createFrom(source: any = {}) {
	        return new Produk(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.sku = source["sku"];
	        this.barcode = source["barcode"];
	        this.nama = source["nama"];
	        this.kategori = source["kategori"];
	        this.berat = source["berat"];
	        this.hargaBeli = source["hargaBeli"];
	        this.hargaJual = source["hargaJual"];
	        this.stok = source["stok"];
	        this.satuan = source["satuan"];
	        this.jenisProduk = source["jenisProduk"];
	        this.kadaluarsa = source["kadaluarsa"];
	        this.masaSimpanHari = source["masaSimpanHari"];
	        this.tanggalMasuk = source["tanggalMasuk"];
	        this.deskripsi = source["deskripsi"];
	        this.gambar = source["gambar"];
	        this.hariPemberitahuanKadaluarsa = source["hariPemberitahuanKadaluarsa"];
	        this.createdAt = this.convertValues(source["createdAt"], null);
	        this.updatedAt = this.convertValues(source["updatedAt"], null);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class Promo {
	    id: number;
	    nama: string;
	    produkXId?: number;
	    produkYId?: number;
	    kode: string;
	    tipe: string;
	    tipe_promo: string;
	    tipeProdukBerlaku: string;
	    nilai: number;
	    minQuantity: number;
	    maxDiskon: number;
	    // Go type: time
	    tanggalMulai: any;
	    // Go type: time
	    tanggalSelesai: any;
	    status: string;
	    deskripsi: string;
	    buyQuantity: number;
	    getQuantity: number;
	    hargaBundling: number;
	    tipeBundling: string;
	    diskonBundling: number;
	    produkX?: Produk;
	    produkY?: Produk;
	    tipeBuyGet: string;
	    // Go type: time
	    createdAt: any;
	    // Go type: time
	    updatedAt: any;
	
	    static createFrom(source: any = {}) {
	        return new Promo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.nama = source["nama"];
	        this.produkXId = source["produkXId"];
	        this.produkYId = source["produkYId"];
	        this.kode = source["kode"];
	        this.tipe = source["tipe"];
	        this.tipe_promo = source["tipe_promo"];
	        this.tipeProdukBerlaku = source["tipeProdukBerlaku"];
	        this.nilai = source["nilai"];
	        this.minQuantity = source["minQuantity"];
	        this.maxDiskon = source["maxDiskon"];
	        this.tanggalMulai = this.convertValues(source["tanggalMulai"], null);
	        this.tanggalSelesai = this.convertValues(source["tanggalSelesai"], null);
	        this.status = source["status"];
	        this.deskripsi = source["deskripsi"];
	        this.buyQuantity = source["buyQuantity"];
	        this.getQuantity = source["getQuantity"];
	        this.hargaBundling = source["hargaBundling"];
	        this.tipeBundling = source["tipeBundling"];
	        this.diskonBundling = source["diskonBundling"];
	        this.produkX = this.convertValues(source["produkX"], Produk);
	        this.produkY = this.convertValues(source["produkY"], Produk);
	        this.tipeBuyGet = source["tipeBuyGet"];
	        this.createdAt = this.convertValues(source["createdAt"], null);
	        this.updatedAt = this.convertValues(source["updatedAt"], null);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class ApplyPromoResponse {
	    success: boolean;
	    message: string;
	    promo?: Promo;
	    diskonJumlah: number;
	    totalSetelah: number;
	    promoProdukIds?: number[];
	
	    static createFrom(source: any = {}) {
	        return new ApplyPromoResponse(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.success = source["success"];
	        this.message = source["message"];
	        this.promo = this.convertValues(source["promo"], Promo);
	        this.diskonJumlah = source["diskonJumlah"];
	        this.totalSetelah = source["totalSetelah"];
	        this.promoProdukIds = source["promoProdukIds"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class Batch {
	    id: string;
	    produkId: number;
	    qty: number;
	    qtyTersisa: number;
	    // Go type: time
	    tanggalRestok: any;
	    masaSimpanHari: number;
	    // Go type: time
	    tanggalKadaluarsa: any;
	    status: string;
	    supplier: string;
	    keterangan: string;
	    // Go type: time
	    createdAt: any;
	    // Go type: time
	    updatedAt: any;
	
	    static createFrom(source: any = {}) {
	        return new Batch(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.produkId = source["produkId"];
	        this.qty = source["qty"];
	        this.qtyTersisa = source["qtyTersisa"];
	        this.tanggalRestok = this.convertValues(source["tanggalRestok"], null);
	        this.masaSimpanHari = source["masaSimpanHari"];
	        this.tanggalKadaluarsa = this.convertValues(source["tanggalKadaluarsa"], null);
	        this.status = source["status"];
	        this.supplier = source["supplier"];
	        this.keterangan = source["keterangan"];
	        this.createdAt = this.convertValues(source["createdAt"], null);
	        this.updatedAt = this.convertValues(source["updatedAt"], null);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class CategoryBreakdownResponse {
	    category: string;
	    total_qty: number;
	    total_revenue: number;
	    trans_count: number;
	    percentage: number;
	
	    static createFrom(source: any = {}) {
	        return new CategoryBreakdownResponse(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.category = source["category"];
	        this.total_qty = source["total_qty"];
	        this.total_revenue = source["total_revenue"];
	        this.trans_count = source["trans_count"];
	        this.percentage = source["percentage"];
	    }
	}
	export class ChangePasswordRequest {
	    userId: number;
	    oldPassword: string;
	    newPassword: string;
	
	    static createFrom(source: any = {}) {
	        return new ChangePasswordRequest(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.userId = source["userId"];
	        this.oldPassword = source["oldPassword"];
	        this.newPassword = source["newPassword"];
	    }
	}
	export class LossBreakdownItem {
	    type: string;
	    label: string;
	    totalLoss: number;
	    count: number;
	    persentase: number;
	
	    static createFrom(source: any = {}) {
	        return new LossBreakdownItem(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.type = source["type"];
	        this.label = source["label"];
	        this.totalLoss = source["totalLoss"];
	        this.count = source["count"];
	        this.persentase = source["persentase"];
	    }
	}
	export class LossAnalysisData {
	    totalLoss: number;
	    lossBreakdown: LossBreakdownItem[];
	    labels: string[];
	    data: number[];
	    colors: string[];
	
	    static createFrom(source: any = {}) {
	        return new LossAnalysisData(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.totalLoss = source["totalLoss"];
	        this.lossBreakdown = this.convertValues(source["lossBreakdown"], LossBreakdownItem);
	        this.labels = source["labels"];
	        this.data = source["data"];
	        this.colors = source["colors"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class PaymentMethodBreakdown {
	    method: string;
	    jumlah: number;
	    totalOmset: number;
	    persentase: number;
	
	    static createFrom(source: any = {}) {
	        return new PaymentMethodBreakdown(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.method = source["method"];
	        this.jumlah = source["jumlah"];
	        this.totalOmset = source["totalOmset"];
	        this.persentase = source["persentase"];
	    }
	}
	export class DiscountTypeBreakdown {
	    type: string;
	    totalDiskon: number;
	    jumlah: number;
	    persentase: number;
	
	    static createFrom(source: any = {}) {
	        return new DiscountTypeBreakdown(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.type = source["type"];
	        this.totalDiskon = source["totalDiskon"];
	        this.jumlah = source["jumlah"];
	        this.persentase = source["persentase"];
	    }
	}
	export class DiscountAnalysis {
	    totalDiskon: number;
	    totalTransaksiDiskon: number;
	    persentaseTransaksi: number;
	    rataRataDiskon: number;
	    diskonTerbesar: number;
	    omsetDenganDiskon: number;
	    omsetTanpaDiskon: number;
	
	    static createFrom(source: any = {}) {
	        return new DiscountAnalysis(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.totalDiskon = source["totalDiskon"];
	        this.totalTransaksiDiskon = source["totalTransaksiDiskon"];
	        this.persentaseTransaksi = source["persentaseTransaksi"];
	        this.rataRataDiskon = source["rataRataDiskon"];
	        this.diskonTerbesar = source["diskonTerbesar"];
	        this.omsetDenganDiskon = source["omsetDenganDiskon"];
	        this.omsetTanpaDiskon = source["omsetTanpaDiskon"];
	    }
	}
	export class TopProductData {
	    rank: number;
	    namaProduk: string;
	    kategori: string;
	    totalTerjual: number;
	    totalOmset: number;
	    persentase: number;
	
	    static createFrom(source: any = {}) {
	        return new TopProductData(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.rank = source["rank"];
	        this.namaProduk = source["namaProduk"];
	        this.kategori = source["kategori"];
	        this.totalTerjual = source["totalTerjual"];
	        this.totalOmset = source["totalOmset"];
	        this.persentase = source["persentase"];
	    }
	}
	export class HourlySalesData {
	    hour: number;
	    omset: number;
	    transaksi: number;
	
	    static createFrom(source: any = {}) {
	        return new HourlySalesData(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.hour = source["hour"];
	        this.omset = source["omset"];
	        this.transaksi = source["transaksi"];
	    }
	}
	export class MonthlySalesData {
	    month: string;
	    monthIndex: number;
	    year: number;
	    omset: number;
	    profit: number;
	    hpp: number;
	    transaksi: number;
	    diskon: number;
	    loss: number;
	
	    static createFrom(source: any = {}) {
	        return new MonthlySalesData(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.month = source["month"];
	        this.monthIndex = source["monthIndex"];
	        this.year = source["year"];
	        this.omset = source["omset"];
	        this.profit = source["profit"];
	        this.hpp = source["hpp"];
	        this.transaksi = source["transaksi"];
	        this.diskon = source["diskon"];
	        this.loss = source["loss"];
	    }
	}
	export class SalesReportDiscountPeriodData {
	    labels: string[];
	    salesWithDiscount: number[];
	    discountValue: number[];
	
	    static createFrom(source: any = {}) {
	        return new SalesReportDiscountPeriodData(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.labels = source["labels"];
	        this.salesWithDiscount = source["salesWithDiscount"];
	        this.discountValue = source["discountValue"];
	    }
	}
	export class SalesReportPeriodData {
	    labels: string[];
	    data: number[];
	
	    static createFrom(source: any = {}) {
	        return new SalesReportPeriodData(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.labels = source["labels"];
	        this.data = source["data"];
	    }
	}
	export class SalesSummaryResponse {
	    totalOmset: number;
	    totalProfit: number;
	    totalTransaksi: number;
	    totalProdukTerjual: number;
	    rataRataTransaksi: number;
	    trendOmset: number;
	    trendProfit: number;
	    trendTransaksi: number;
	    trendProdukTerjual: number;
	    trendRataRata: number;
	
	    static createFrom(source: any = {}) {
	        return new SalesSummaryResponse(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.totalOmset = source["totalOmset"];
	        this.totalProfit = source["totalProfit"];
	        this.totalTransaksi = source["totalTransaksi"];
	        this.totalProdukTerjual = source["totalProdukTerjual"];
	        this.rataRataTransaksi = source["rataRataTransaksi"];
	        this.trendOmset = source["trendOmset"];
	        this.trendProfit = source["trendProfit"];
	        this.trendTransaksi = source["trendTransaksi"];
	        this.trendProdukTerjual = source["trendProdukTerjual"];
	        this.trendRataRata = source["trendRataRata"];
	    }
	}
	export class ComprehensiveSalesReport {
	    summary?: SalesSummaryResponse;
	    salesTrendData: Record<string, SalesReportPeriodData>;
	    discountTrendData: Record<string, SalesReportDiscountPeriodData>;
	    monthlySales: MonthlySalesData[];
	    hourlySales: HourlySalesData[];
	    hourlySalesTrendData: Record<string, SalesReportPeriodData>;
	    topProducts: TopProductData[];
	    discountAnalysis?: DiscountAnalysis;
	    discountTypeBreakdown: DiscountTypeBreakdown[];
	    paymentMethodBreakdown: PaymentMethodBreakdown[];
	    lossAnalysis?: LossAnalysisData;
	    // Go type: time
	    startDate: any;
	    // Go type: time
	    endDate: any;
	    // Go type: time
	    generatedAt: any;
	
	    static createFrom(source: any = {}) {
	        return new ComprehensiveSalesReport(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.summary = this.convertValues(source["summary"], SalesSummaryResponse);
	        this.salesTrendData = this.convertValues(source["salesTrendData"], SalesReportPeriodData, true);
	        this.discountTrendData = this.convertValues(source["discountTrendData"], SalesReportDiscountPeriodData, true);
	        this.monthlySales = this.convertValues(source["monthlySales"], MonthlySalesData);
	        this.hourlySales = this.convertValues(source["hourlySales"], HourlySalesData);
	        this.hourlySalesTrendData = this.convertValues(source["hourlySalesTrendData"], SalesReportPeriodData, true);
	        this.topProducts = this.convertValues(source["topProducts"], TopProductData);
	        this.discountAnalysis = this.convertValues(source["discountAnalysis"], DiscountAnalysis);
	        this.discountTypeBreakdown = this.convertValues(source["discountTypeBreakdown"], DiscountTypeBreakdown);
	        this.paymentMethodBreakdown = this.convertValues(source["paymentMethodBreakdown"], PaymentMethodBreakdown);
	        this.lossAnalysis = this.convertValues(source["lossAnalysis"], LossAnalysisData);
	        this.startDate = this.convertValues(source["startDate"], null);
	        this.endDate = this.convertValues(source["endDate"], null);
	        this.generatedAt = this.convertValues(source["generatedAt"], null);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class StaffReport {
	    staffId: number;
	    namaStaff: string;
	    totalTransaksi: number;
	    totalPenjualan: number;
	    totalProfit: number;
	    totalItemTerjual: number;
	    totalRefund: number;
	    totalReturnCount: number;
	    // Go type: time
	    periodeMulai: any;
	    // Go type: time
	    periodeSelesai: any;
	
	    static createFrom(source: any = {}) {
	        return new StaffReport(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.staffId = source["staffId"];
	        this.namaStaff = source["namaStaff"];
	        this.totalTransaksi = source["totalTransaksi"];
	        this.totalPenjualan = source["totalPenjualan"];
	        this.totalProfit = source["totalProfit"];
	        this.totalItemTerjual = source["totalItemTerjual"];
	        this.totalRefund = source["totalRefund"];
	        this.totalReturnCount = source["totalReturnCount"];
	        this.periodeMulai = this.convertValues(source["periodeMulai"], null);
	        this.periodeSelesai = this.convertValues(source["periodeSelesai"], null);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class StaffReportWithTrend {
	    current?: StaffReport;
	    previous?: StaffReport;
	    trendPenjualan: string;
	    trendTransaksi: string;
	    percentChange: number;
	
	    static createFrom(source: any = {}) {
	        return new StaffReportWithTrend(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.current = this.convertValues(source["current"], StaffReport);
	        this.previous = this.convertValues(source["previous"], StaffReport);
	        this.trendPenjualan = source["trendPenjualan"];
	        this.trendTransaksi = source["trendTransaksi"];
	        this.percentChange = source["percentChange"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class ComprehensiveStaffReport {
	    totalPenjualan30Hari: number;
	    totalTransaksi30Hari: number;
	    produkTerlaris: string;
	    trendVsPrevious: string;
	    percentChange: number;
	    staffReports: StaffReportWithTrend[];
	
	    static createFrom(source: any = {}) {
	        return new ComprehensiveStaffReport(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.totalPenjualan30Hari = source["totalPenjualan30Hari"];
	        this.totalTransaksi30Hari = source["totalTransaksi30Hari"];
	        this.produkTerlaris = source["produkTerlaris"];
	        this.trendVsPrevious = source["trendVsPrevious"];
	        this.percentChange = source["percentChange"];
	        this.staffReports = this.convertValues(source["staffReports"], StaffReportWithTrend);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class CreatePelangganRequest {
	    nama: string;
	    telepon: string;
	    email: string;
	    alamat: string;
	    level: number;
	    poin: number;
	
	    static createFrom(source: any = {}) {
	        return new CreatePelangganRequest(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.nama = source["nama"];
	        this.telepon = source["telepon"];
	        this.email = source["email"];
	        this.alamat = source["alamat"];
	        this.level = source["level"];
	        this.poin = source["poin"];
	    }
	}
	export class CreatePromoRequest {
	    nama: string;
	    kode: string;
	    tipe: string;
	    tipe_promo: string;
	    tipeProdukBerlaku: string;
	    nilai: number;
	    minQuantity: number;
	    maxDiskon: number;
	    tanggalMulai: string;
	    tanggalSelesai: string;
	    status: string;
	    deskripsi: string;
	    buyQuantity: number;
	    getQuantity: number;
	    tipeBuyGet: string;
	    hargaBundling: number;
	    tipeBundling: string;
	    diskonBundling: number;
	    produkIds: number[];
	    produkX?: number;
	    produkY?: number;
	
	    static createFrom(source: any = {}) {
	        return new CreatePromoRequest(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.nama = source["nama"];
	        this.kode = source["kode"];
	        this.tipe = source["tipe"];
	        this.tipe_promo = source["tipe_promo"];
	        this.tipeProdukBerlaku = source["tipeProdukBerlaku"];
	        this.nilai = source["nilai"];
	        this.minQuantity = source["minQuantity"];
	        this.maxDiskon = source["maxDiskon"];
	        this.tanggalMulai = source["tanggalMulai"];
	        this.tanggalSelesai = source["tanggalSelesai"];
	        this.status = source["status"];
	        this.deskripsi = source["deskripsi"];
	        this.buyQuantity = source["buyQuantity"];
	        this.getQuantity = source["getQuantity"];
	        this.tipeBuyGet = source["tipeBuyGet"];
	        this.hargaBundling = source["hargaBundling"];
	        this.tipeBundling = source["tipeBundling"];
	        this.diskonBundling = source["diskonBundling"];
	        this.produkIds = source["produkIds"];
	        this.produkX = source["produkX"];
	        this.produkY = source["produkY"];
	    }
	}
	export class ReturnProductRequest {
	    product_id: number;
	    quantity: number;
	
	    static createFrom(source: any = {}) {
	        return new ReturnProductRequest(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.product_id = source["product_id"];
	        this.quantity = source["quantity"];
	    }
	}
	export class CreateReturnRequest {
	    transaksi_id: number;
	    no_transaksi: string;
	    products: ReturnProductRequest[];
	    reason: string;
	    type: string;
	    replacement_product_id?: number;
	    return_date: string;
	    refund_method?: string;
	    notes?: string;
	
	    static createFrom(source: any = {}) {
	        return new CreateReturnRequest(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.transaksi_id = source["transaksi_id"];
	        this.no_transaksi = source["no_transaksi"];
	        this.products = this.convertValues(source["products"], ReturnProductRequest);
	        this.reason = source["reason"];
	        this.type = source["type"];
	        this.replacement_product_id = source["replacement_product_id"];
	        this.return_date = source["return_date"];
	        this.refund_method = source["refund_method"];
	        this.notes = source["notes"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class PembayaranRequest {
	    metode: string;
	    jumlah: number;
	    referensi: string;
	
	    static createFrom(source: any = {}) {
	        return new PembayaranRequest(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.metode = source["metode"];
	        this.jumlah = source["jumlah"];
	        this.referensi = source["referensi"];
	    }
	}
	export class CreateTransaksiRequest {
	    pelangganId: number;
	    pelangganNama: string;
	    pelangganTelp: string;
	    items: TransaksiItemRequest[];
	    pembayaran: PembayaranRequest[];
	    promoKode: string;
	    poinDitukar: number;
	    diskon: number;
	    catatan: string;
	    kasir: string;
	    staffId: number;
	    staffNama: string;
	    // Go type: time
	    createdAt: any;
	
	    static createFrom(source: any = {}) {
	        return new CreateTransaksiRequest(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.pelangganId = source["pelangganId"];
	        this.pelangganNama = source["pelangganNama"];
	        this.pelangganTelp = source["pelangganTelp"];
	        this.items = this.convertValues(source["items"], TransaksiItemRequest);
	        this.pembayaran = this.convertValues(source["pembayaran"], PembayaranRequest);
	        this.promoKode = source["promoKode"];
	        this.poinDitukar = source["poinDitukar"];
	        this.diskon = source["diskon"];
	        this.catatan = source["catatan"];
	        this.kasir = source["kasir"];
	        this.staffId = source["staffId"];
	        this.staffNama = source["staffNama"];
	        this.createdAt = this.convertValues(source["createdAt"], null);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class CreateUserRequest {
	    username: string;
	    password: string;
	    namaLengkap: string;
	    role: string;
	
	    static createFrom(source: any = {}) {
	        return new CreateUserRequest(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.username = source["username"];
	        this.password = source["password"];
	        this.namaLengkap = source["namaLengkap"];
	        this.role = source["role"];
	    }
	}
	export class CustomReceiptItem {
	    name: string;
	    quantity: number;
	    price: number;
	    subtotal: number;
	
	    static createFrom(source: any = {}) {
	        return new CustomReceiptItem(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.quantity = source["quantity"];
	        this.price = source["price"];
	        this.subtotal = source["subtotal"];
	    }
	}
	export class CustomReceiptData {
	    storeName: string;
	    address: string;
	    phone: string;
	    transactionNo: string;
	    // Go type: time
	    date: any;
	    cashier: string;
	    customerName: string;
	    items: CustomReceiptItem[];
	    subtotal: number;
	    discount: number;
	    total: number;
	    payment: number;
	    change: number;
	    paymentMethod: string;
	    footerText: string;
	
	    static createFrom(source: any = {}) {
	        return new CustomReceiptData(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.storeName = source["storeName"];
	        this.address = source["address"];
	        this.phone = source["phone"];
	        this.transactionNo = source["transactionNo"];
	        this.date = this.convertValues(source["date"], null);
	        this.cashier = source["cashier"];
	        this.customerName = source["customerName"];
	        this.items = this.convertValues(source["items"], CustomReceiptItem);
	        this.subtotal = source["subtotal"];
	        this.discount = source["discount"];
	        this.total = source["total"];
	        this.payment = source["payment"];
	        this.change = source["change"];
	        this.paymentMethod = source["paymentMethod"];
	        this.footerText = source["footerText"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	
	export class DashboardAktivitas {
	    id: number;
	    title: string;
	    time: string;
	    icon: string;
	    color: string;
	
	    static createFrom(source: any = {}) {
	        return new DashboardAktivitas(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.title = source["title"];
	        this.time = source["time"];
	        this.icon = source["icon"];
	        this.color = source["color"];
	    }
	}
	export class DashboardProdukTerlaris {
	    id: number;
	    nama: string;
	    kategori: string;
	    harga: number;
	    terjual: number;
	    satuan: string;
	    color: string;
	
	    static createFrom(source: any = {}) {
	        return new DashboardProdukTerlaris(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.nama = source["nama"];
	        this.kategori = source["kategori"];
	        this.harga = source["harga"];
	        this.terjual = source["terjual"];
	        this.satuan = source["satuan"];
	        this.color = source["color"];
	    }
	}
	export class DashboardPerforma {
	    id: number;
	    title: string;
	    value: number;
	    target: number;
	    trend: number;
	    icon: string;
	    color: string;
	
	    static createFrom(source: any = {}) {
	        return new DashboardPerforma(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.title = source["title"];
	        this.value = source["value"];
	        this.target = source["target"];
	        this.trend = source["trend"];
	        this.icon = source["icon"];
	        this.color = source["color"];
	    }
	}
	export class DashboardNotifikasi {
	    id: number;
	    type: string;
	    title: string;
	    message: string;
	    priority: string;
	    time: string;
	
	    static createFrom(source: any = {}) {
	        return new DashboardNotifikasi(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.type = source["type"];
	        this.title = source["title"];
	        this.message = source["message"];
	        this.priority = source["priority"];
	        this.time = source["time"];
	    }
	}
	export class DashboardStatistikBulanan {
	    totalPendapatan: number;
	    totalTransaksi: number;
	    produkTerjual: number;
	    keuntunganBersih: number;
	    vsBulanLalu: number;
	
	    static createFrom(source: any = {}) {
	        return new DashboardStatistikBulanan(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.totalPendapatan = source["totalPendapatan"];
	        this.totalTransaksi = source["totalTransaksi"];
	        this.produkTerjual = source["produkTerjual"];
	        this.keuntunganBersih = source["keuntunganBersih"];
	        this.vsBulanLalu = source["vsBulanLalu"];
	    }
	}
	export class DashboardData {
	    statistikBulanan: DashboardStatistikBulanan;
	    notifikasi: DashboardNotifikasi[];
	    performaHariIni: DashboardPerforma[];
	    produkTerlaris: DashboardProdukTerlaris[];
	    aktivitasTerakhir: DashboardAktivitas[];
	
	    static createFrom(source: any = {}) {
	        return new DashboardData(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.statistikBulanan = this.convertValues(source["statistikBulanan"], DashboardStatistikBulanan);
	        this.notifikasi = this.convertValues(source["notifikasi"], DashboardNotifikasi);
	        this.performaHariIni = this.convertValues(source["performaHariIni"], DashboardPerforma);
	        this.produkTerlaris = this.convertValues(source["produkTerlaris"], DashboardProdukTerlaris);
	        this.aktivitasTerakhir = this.convertValues(source["aktivitasTerakhir"], DashboardAktivitas);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	
	
	export class DashboardPeriodData {
	    labels: string[];
	    data: number[];
	
	    static createFrom(source: any = {}) {
	        return new DashboardPeriodData(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.labels = source["labels"];
	        this.data = source["data"];
	    }
	}
	
	export class DashboardSalesData {
	    hari: DashboardPeriodData;
	    minggu: DashboardPeriodData;
	    bulan: DashboardPeriodData;
	
	    static createFrom(source: any = {}) {
	        return new DashboardSalesData(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.hari = this.convertValues(source["hari"], DashboardPeriodData);
	        this.minggu = this.convertValues(source["minggu"], DashboardPeriodData);
	        this.bulan = this.convertValues(source["bulan"], DashboardPeriodData);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class DashboardSalesChartResponse {
	    salesData: DashboardSalesData;
	
	    static createFrom(source: any = {}) {
	        return new DashboardSalesChartResponse(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.salesData = this.convertValues(source["salesData"], DashboardSalesData);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	
	
	
	
	export class HardwareDevice {
	    name: string;
	    type: string;
	    connection: string;
	    port: string;
	    vendorId: string;
	    productId: string;
	    manufacturer: string;
	    description: string;
	    isConnected: boolean;
	
	    static createFrom(source: any = {}) {
	        return new HardwareDevice(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.type = source["type"];
	        this.connection = source["connection"];
	        this.port = source["port"];
	        this.vendorId = source["vendorId"];
	        this.productId = source["productId"];
	        this.manufacturer = source["manufacturer"];
	        this.description = source["description"];
	        this.isConnected = source["isConnected"];
	    }
	}
	export class HardwareListResponse {
	    devices: HardwareDevice[];
	    count: number;
	
	    static createFrom(source: any = {}) {
	        return new HardwareListResponse(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.devices = this.convertValues(source["devices"], HardwareDevice);
	        this.count = source["count"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	
	export class HourlySalesResponse {
	    hour: number;
	    day_of_week: number;
	    trans_count: number;
	    total_sales: number;
	
	    static createFrom(source: any = {}) {
	        return new HourlySalesResponse(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.hour = source["hour"];
	        this.day_of_week = source["day_of_week"];
	        this.trans_count = source["trans_count"];
	        this.total_sales = source["total_sales"];
	    }
	}
	export class Kategori {
	    id: number;
	    nama: string;
	    deskripsi: string;
	    icon: string;
	    jumlahProduk: number;
	    // Go type: time
	    createdAt: any;
	    // Go type: time
	    updatedAt: any;
	
	    static createFrom(source: any = {}) {
	        return new Kategori(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.nama = source["nama"];
	        this.deskripsi = source["deskripsi"];
	        this.icon = source["icon"];
	        this.jumlahProduk = source["jumlahProduk"];
	        this.createdAt = this.convertValues(source["createdAt"], null);
	        this.updatedAt = this.convertValues(source["updatedAt"], null);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class KeranjangItem {
	    id: number;
	    produk?: Produk;
	    jumlah: number;
	    hargaBeli: number;
	    subtotal: number;
	    // Go type: time
	    createdAt: any;
	
	    static createFrom(source: any = {}) {
	        return new KeranjangItem(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.produk = this.convertValues(source["produk"], Produk);
	        this.jumlah = source["jumlah"];
	        this.hargaBeli = source["hargaBeli"];
	        this.subtotal = source["subtotal"];
	        this.createdAt = this.convertValues(source["createdAt"], null);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class LoginRequest {
	    username: string;
	    password: string;
	
	    static createFrom(source: any = {}) {
	        return new LoginRequest(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.username = source["username"];
	        this.password = source["password"];
	    }
	}
	export class User {
	    id: number;
	    username: string;
	    namaLengkap: string;
	    role: string;
	    status: string;
	    // Go type: time
	    createdAt: any;
	    // Go type: time
	    updatedAt: any;
	    // Go type: time
	    deletedAt?: any;
	
	    static createFrom(source: any = {}) {
	        return new User(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.username = source["username"];
	        this.namaLengkap = source["namaLengkap"];
	        this.role = source["role"];
	        this.status = source["status"];
	        this.createdAt = this.convertValues(source["createdAt"], null);
	        this.updatedAt = this.convertValues(source["updatedAt"], null);
	        this.deletedAt = this.convertValues(source["deletedAt"], null);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class LoginResponse {
	    success: boolean;
	    message: string;
	    user?: User;
	    token?: string;
	
	    static createFrom(source: any = {}) {
	        return new LoginResponse(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.success = source["success"];
	        this.message = source["message"];
	        this.user = this.convertValues(source["user"], User);
	        this.token = source["token"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	
	
	
	export class PaymentBreakdownResponse {
	    method: string;
	    total_amount: number;
	    count: number;
	    percentage: number;
	    average_value: number;
	
	    static createFrom(source: any = {}) {
	        return new PaymentBreakdownResponse(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.method = source["method"];
	        this.total_amount = source["total_amount"];
	        this.count = source["count"];
	        this.percentage = source["percentage"];
	        this.average_value = source["average_value"];
	    }
	}
	
	export class Pelanggan {
	    id: number;
	    nama: string;
	    telepon: string;
	    email: string;
	    alamat: string;
	    level: number;
	    tipe: string;
	    poin: number;
	    totalTransaksi: number;
	    totalBelanja: number;
	    // Go type: time
	    createdAt: any;
	    // Go type: time
	    updatedAt: any;
	
	    static createFrom(source: any = {}) {
	        return new Pelanggan(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.nama = source["nama"];
	        this.telepon = source["telepon"];
	        this.email = source["email"];
	        this.alamat = source["alamat"];
	        this.level = source["level"];
	        this.tipe = source["tipe"];
	        this.poin = source["poin"];
	        this.totalTransaksi = source["totalTransaksi"];
	        this.totalBelanja = source["totalBelanja"];
	        this.createdAt = this.convertValues(source["createdAt"], null);
	        this.updatedAt = this.convertValues(source["updatedAt"], null);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class Transaksi {
	    id: number;
	    nomorTransaksi: string;
	    // Go type: time
	    tanggal: any;
	    pelangganId: number;
	    pelangganNama: string;
	    pelangganTelp: string;
	    subtotal: number;
	    diskonPromo: number;
	    diskonPelanggan: number;
	    poinDitukar: number;
	    diskonPoin: number;
	    diskon: number;
	    total: number;
	    totalBayar: number;
	    kembalian: number;
	    status: string;
	    catatan: string;
	    kasir: string;
	    staffId?: number;
	    staffNama: string;
	    // Go type: time
	    createdAt: any;
	
	    static createFrom(source: any = {}) {
	        return new Transaksi(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.nomorTransaksi = source["nomorTransaksi"];
	        this.tanggal = this.convertValues(source["tanggal"], null);
	        this.pelangganId = source["pelangganId"];
	        this.pelangganNama = source["pelangganNama"];
	        this.pelangganTelp = source["pelangganTelp"];
	        this.subtotal = source["subtotal"];
	        this.diskonPromo = source["diskonPromo"];
	        this.diskonPelanggan = source["diskonPelanggan"];
	        this.poinDitukar = source["poinDitukar"];
	        this.diskonPoin = source["diskonPoin"];
	        this.diskon = source["diskon"];
	        this.total = source["total"];
	        this.totalBayar = source["totalBayar"];
	        this.kembalian = source["kembalian"];
	        this.status = source["status"];
	        this.catatan = source["catatan"];
	        this.kasir = source["kasir"];
	        this.staffId = source["staffId"];
	        this.staffNama = source["staffNama"];
	        this.createdAt = this.convertValues(source["createdAt"], null);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class PelangganStats {
	    totalTransaksi: number;
	    totalBelanja: number;
	    rataRataBelanja: number;
	
	    static createFrom(source: any = {}) {
	        return new PelangganStats(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.totalTransaksi = source["totalTransaksi"];
	        this.totalBelanja = source["totalBelanja"];
	        this.rataRataBelanja = source["rataRataBelanja"];
	    }
	}
	export class PelangganDetail {
	    pelanggan?: Pelanggan;
	    stats?: PelangganStats;
	    transaksiHistory: Transaksi[];
	
	    static createFrom(source: any = {}) {
	        return new PelangganDetail(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.pelanggan = this.convertValues(source["pelanggan"], Pelanggan);
	        this.stats = this.convertValues(source["stats"], PelangganStats);
	        this.transaksiHistory = this.convertValues(source["transaksiHistory"], Transaksi);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	
	export class Pembayaran {
	    id: number;
	    transaksiId: number;
	    metode: string;
	    jumlah: number;
	    referensi: string;
	    // Go type: time
	    createdAt: any;
	
	    static createFrom(source: any = {}) {
	        return new Pembayaran(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.transaksiId = source["transaksiId"];
	        this.metode = source["metode"];
	        this.jumlah = source["jumlah"];
	        this.referensi = source["referensi"];
	        this.createdAt = this.convertValues(source["createdAt"], null);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	
	export class PoinSettings {
	    id: number;
	    pointValue: number;
	    minExchange: number;
	    minTransactionForPoints: number;
	    level2MinPoints: number;
	    level3MinPoints: number;
	    level2MinSpending: number;
	    level3MinSpending: number;
	
	    static createFrom(source: any = {}) {
	        return new PoinSettings(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.pointValue = source["pointValue"];
	        this.minExchange = source["minExchange"];
	        this.minTransactionForPoints = source["minTransactionForPoints"];
	        this.level2MinPoints = source["level2MinPoints"];
	        this.level3MinPoints = source["level3MinPoints"];
	        this.level2MinSpending = source["level2MinSpending"];
	        this.level3MinSpending = source["level3MinSpending"];
	    }
	}
	export class PrintReceiptRequest {
	    printerName: string;
	    transactionId?: number;
	    transactionNo?: string;
	    useCustomData?: boolean;
	    customData?: CustomReceiptData;
	
	    static createFrom(source: any = {}) {
	        return new PrintReceiptRequest(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.printerName = source["printerName"];
	        this.transactionId = source["transactionId"];
	        this.transactionNo = source["transactionNo"];
	        this.useCustomData = source["useCustomData"];
	        this.customData = this.convertValues(source["customData"], CustomReceiptData);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class PrintSettings {
	    id: number;
	    printerName: string;
	    paperSize: string;
	    paperWidth: number;
	    fontSize: string;
	    lineSpacing: number;
	    leftMargin: number;
	    dashLineChar: string;
	    doubleLineChar: string;
	    headerAlignment: string;
	    titleAlignment: string;
	    footerAlignment: string;
	    headerText: string;
	    headerAddress: string;
	    headerPhone: string;
	    footerText: string;
	    showLogo: boolean;
	    autoPrint: boolean;
	    copiesCount: number;
	    // Go type: time
	    createdAt: any;
	    // Go type: time
	    updatedAt: any;
	
	    static createFrom(source: any = {}) {
	        return new PrintSettings(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.printerName = source["printerName"];
	        this.paperSize = source["paperSize"];
	        this.paperWidth = source["paperWidth"];
	        this.fontSize = source["fontSize"];
	        this.lineSpacing = source["lineSpacing"];
	        this.leftMargin = source["leftMargin"];
	        this.dashLineChar = source["dashLineChar"];
	        this.doubleLineChar = source["doubleLineChar"];
	        this.headerAlignment = source["headerAlignment"];
	        this.titleAlignment = source["titleAlignment"];
	        this.footerAlignment = source["footerAlignment"];
	        this.headerText = source["headerText"];
	        this.headerAddress = source["headerAddress"];
	        this.headerPhone = source["headerPhone"];
	        this.footerText = source["footerText"];
	        this.showLogo = source["showLogo"];
	        this.autoPrint = source["autoPrint"];
	        this.copiesCount = source["copiesCount"];
	        this.createdAt = this.convertValues(source["createdAt"], null);
	        this.updatedAt = this.convertValues(source["updatedAt"], null);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class PrinterInfo {
	    name: string;
	    displayName: string;
	    type: string;
	    isDefault: boolean;
	    status: string;
	    port?: string;
	
	    static createFrom(source: any = {}) {
	        return new PrinterInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.displayName = source["displayName"];
	        this.type = source["type"];
	        this.isDefault = source["isDefault"];
	        this.status = source["status"];
	        this.port = source["port"];
	    }
	}
	
	
	export class Return {
	    id: number;
	    transaksi_id: number;
	    no_transaksi: string;
	    // Go type: time
	    return_date: any;
	    reason: string;
	    type: string;
	    replacement_product_id?: number;
	    refund_amount: number;
	    refund_method?: string;
	    refund_status: string;
	    notes?: string;
	    // Go type: time
	    createdAt: any;
	    // Go type: time
	    updatedAt: any;
	
	    static createFrom(source: any = {}) {
	        return new Return(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.transaksi_id = source["transaksi_id"];
	        this.no_transaksi = source["no_transaksi"];
	        this.return_date = this.convertValues(source["return_date"], null);
	        this.reason = source["reason"];
	        this.type = source["type"];
	        this.replacement_product_id = source["replacement_product_id"];
	        this.refund_amount = source["refund_amount"];
	        this.refund_method = source["refund_method"];
	        this.refund_status = source["refund_status"];
	        this.notes = source["notes"];
	        this.createdAt = this.convertValues(source["createdAt"], null);
	        this.updatedAt = this.convertValues(source["updatedAt"], null);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class ReturnProduct {
	    id: number;
	    product_id: number;
	    nama: string;
	    quantity: number;
	
	    static createFrom(source: any = {}) {
	        return new ReturnProduct(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.product_id = source["product_id"];
	        this.nama = source["nama"];
	        this.quantity = source["quantity"];
	    }
	}
	export class ReturnDetail {
	    return?: Return;
	    products: ReturnProduct[];
	
	    static createFrom(source: any = {}) {
	        return new ReturnDetail(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.return = this.convertValues(source["return"], Return);
	        this.products = this.convertValues(source["products"], ReturnProduct);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	
	
	export class SalesTrendResponse {
	    date: string;
	    total_sales: number;
	    trans_count: number;
	    average_trans: number;
	    total_items: number;
	
	    static createFrom(source: any = {}) {
	        return new SalesTrendResponse(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.date = source["date"];
	        this.total_sales = source["total_sales"];
	        this.trans_count = source["trans_count"];
	        this.average_trans = source["average_trans"];
	        this.total_items = source["total_items"];
	    }
	}
	export class TopProductsResponse {
	    product_id: number;
	    product_sku: string;
	    product_name: string;
	    category: string;
	    total_qty: number;
	    total_revenue: number;
	    times_sold: number;
	    average_price: number;
	
	    static createFrom(source: any = {}) {
	        return new TopProductsResponse(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.product_id = source["product_id"];
	        this.product_sku = source["product_sku"];
	        this.product_name = source["product_name"];
	        this.category = source["category"];
	        this.total_qty = source["total_qty"];
	        this.total_revenue = source["total_revenue"];
	        this.times_sold = source["times_sold"];
	        this.average_price = source["average_price"];
	    }
	}
	export class SalesInsightsResponse {
	    top_products: TopProductsResponse[];
	    payment_breakdown: PaymentBreakdownResponse[];
	    category_breakdown: CategoryBreakdownResponse[];
	    sales_trend: SalesTrendResponse[];
	    peak_hour: number;
	    peak_day: number;
	    total_discount: number;
	    total_refund: number;
	    average_transaction: number;
	    total_transactions: number;
	    total_revenue: number;
	
	    static createFrom(source: any = {}) {
	        return new SalesInsightsResponse(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.top_products = this.convertValues(source["top_products"], TopProductsResponse);
	        this.payment_breakdown = this.convertValues(source["payment_breakdown"], PaymentBreakdownResponse);
	        this.category_breakdown = this.convertValues(source["category_breakdown"], CategoryBreakdownResponse);
	        this.sales_trend = this.convertValues(source["sales_trend"], SalesTrendResponse);
	        this.peak_hour = source["peak_hour"];
	        this.peak_day = source["peak_day"];
	        this.total_discount = source["total_discount"];
	        this.total_refund = source["total_refund"];
	        this.average_transaction = source["average_transaction"];
	        this.total_transactions = source["total_transactions"];
	        this.total_revenue = source["total_revenue"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	
	
	
	
	export class ScanBarcodeResponse {
	    success: boolean;
	    message: string;
	    produk?: Produk;
	    item?: KeranjangItem;
	
	    static createFrom(source: any = {}) {
	        return new ScanBarcodeResponse(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.success = source["success"];
	        this.message = source["message"];
	        this.produk = this.convertValues(source["produk"], Produk);
	        this.item = this.convertValues(source["item"], KeranjangItem);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class StaffDailyReport {
	    // Go type: time
	    tanggal: any;
	    totalTransaksi: number;
	    totalPenjualan: number;
	    totalProfit: number;
	    totalItemTerjual: number;
	
	    static createFrom(source: any = {}) {
	        return new StaffDailyReport(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.tanggal = this.convertValues(source["tanggal"], null);
	        this.totalTransaksi = source["totalTransaksi"];
	        this.totalPenjualan = source["totalPenjualan"];
	        this.totalProfit = source["totalProfit"];
	        this.totalItemTerjual = source["totalItemTerjual"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class StaffHistoricalData {
	    daily: StaffDailyReport[];
	    weekly: StaffReport[];
	    monthly: StaffReport[];
	
	    static createFrom(source: any = {}) {
	        return new StaffHistoricalData(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.daily = this.convertValues(source["daily"], StaffDailyReport);
	        this.weekly = this.convertValues(source["weekly"], StaffReport);
	        this.monthly = this.convertValues(source["monthly"], StaffReport);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	
	export class StaffReportDetailWithItems {
	    report?: StaffReport;
	    transaksi: Transaksi[];
	    itemCountsByDate: Record<string, number>;
	
	    static createFrom(source: any = {}) {
	        return new StaffReportDetailWithItems(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.report = this.convertValues(source["report"], StaffReport);
	        this.transaksi = this.convertValues(source["transaksi"], Transaksi);
	        this.itemCountsByDate = source["itemCountsByDate"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	
	export class StokHistory {
	    id: number;
	    produkId: number;
	    stokSebelum: number;
	    stokSesudah: number;
	    perubahan: number;
	    jenisPerubahan: string;
	    keterangan: string;
	    tipeKerugian: string;
	    nilaiKerugian: number;
	    // Go type: time
	    createdAt: any;
	
	    static createFrom(source: any = {}) {
	        return new StokHistory(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.produkId = source["produkId"];
	        this.stokSebelum = source["stokSebelum"];
	        this.stokSesudah = source["stokSesudah"];
	        this.perubahan = source["perubahan"];
	        this.jenisPerubahan = source["jenisPerubahan"];
	        this.keterangan = source["keterangan"];
	        this.tipeKerugian = source["tipeKerugian"];
	        this.nilaiKerugian = source["nilaiKerugian"];
	        this.createdAt = this.convertValues(source["createdAt"], null);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class TestHardwareResponse {
	    success: boolean;
	    message: string;
	    data?: string;
	
	    static createFrom(source: any = {}) {
	        return new TestHardwareResponse(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.success = source["success"];
	        this.message = source["message"];
	        this.data = source["data"];
	    }
	}
	
	
	
	export class TransaksiItem {
	    id: number;
	    transaksiId: number;
	    produkId?: number;
	    produkSku: string;
	    produkNama: string;
	    produkKategori: string;
	    hargaSatuan: number;
	    jumlah: number;
	    beratGram: number;
	    subtotal: number;
	    // Go type: time
	    createdAt: any;
	
	    static createFrom(source: any = {}) {
	        return new TransaksiItem(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.transaksiId = source["transaksiId"];
	        this.produkId = source["produkId"];
	        this.produkSku = source["produkSku"];
	        this.produkNama = source["produkNama"];
	        this.produkKategori = source["produkKategori"];
	        this.hargaSatuan = source["hargaSatuan"];
	        this.jumlah = source["jumlah"];
	        this.beratGram = source["beratGram"];
	        this.subtotal = source["subtotal"];
	        this.createdAt = this.convertValues(source["createdAt"], null);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class TransaksiDetail {
	    transaksi?: Transaksi;
	    items: TransaksiItem[];
	    pembayaran: Pembayaran[];
	
	    static createFrom(source: any = {}) {
	        return new TransaksiDetail(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.transaksi = this.convertValues(source["transaksi"], Transaksi);
	        this.items = this.convertValues(source["items"], TransaksiItem);
	        this.pembayaran = this.convertValues(source["pembayaran"], Pembayaran);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	
	
	export class TransaksiResponse {
	    success: boolean;
	    message: string;
	    transaksi?: TransaksiDetail;
	
	    static createFrom(source: any = {}) {
	        return new TransaksiResponse(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.success = source["success"];
	        this.message = source["message"];
	        this.transaksi = this.convertValues(source["transaksi"], TransaksiDetail);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class UpdatePelangganRequest {
	    id: number;
	    nama: string;
	    telepon: string;
	    email: string;
	    alamat: string;
	
	    static createFrom(source: any = {}) {
	        return new UpdatePelangganRequest(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.nama = source["nama"];
	        this.telepon = source["telepon"];
	        this.email = source["email"];
	        this.alamat = source["alamat"];
	    }
	}
	export class UpdatePoinSettingsRequest {
	    pointValue: number;
	    minExchange: number;
	    minTransactionForPoints: number;
	    level2MinPoints: number;
	    level3MinPoints: number;
	    level2MinSpending: number;
	    level3MinSpending: number;
	
	    static createFrom(source: any = {}) {
	        return new UpdatePoinSettingsRequest(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.pointValue = source["pointValue"];
	        this.minExchange = source["minExchange"];
	        this.minTransactionForPoints = source["minTransactionForPoints"];
	        this.level2MinPoints = source["level2MinPoints"];
	        this.level3MinPoints = source["level3MinPoints"];
	        this.level2MinSpending = source["level2MinSpending"];
	        this.level3MinSpending = source["level3MinSpending"];
	    }
	}
	export class UpdatePromoRequest {
	    id: number;
	    nama: string;
	    kode: string;
	    tipe: string;
	    tipe_promo: string;
	    tipeProdukBerlaku: string;
	    nilai: number;
	    minQuantity: number;
	    maxDiskon: number;
	    tanggalMulai: string;
	    tanggalSelesai: string;
	    status: string;
	    deskripsi: string;
	    buyQuantity: number;
	    getQuantity: number;
	    tipeBuyGet: string;
	    hargaBundling: number;
	    tipeBundling: string;
	    diskonBundling: number;
	    produkIds: number[];
	    produkX?: number;
	    produkY?: number;
	
	    static createFrom(source: any = {}) {
	        return new UpdatePromoRequest(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.nama = source["nama"];
	        this.kode = source["kode"];
	        this.tipe = source["tipe"];
	        this.tipe_promo = source["tipe_promo"];
	        this.tipeProdukBerlaku = source["tipeProdukBerlaku"];
	        this.nilai = source["nilai"];
	        this.minQuantity = source["minQuantity"];
	        this.maxDiskon = source["maxDiskon"];
	        this.tanggalMulai = source["tanggalMulai"];
	        this.tanggalSelesai = source["tanggalSelesai"];
	        this.status = source["status"];
	        this.deskripsi = source["deskripsi"];
	        this.buyQuantity = source["buyQuantity"];
	        this.getQuantity = source["getQuantity"];
	        this.tipeBuyGet = source["tipeBuyGet"];
	        this.hargaBundling = source["hargaBundling"];
	        this.tipeBundling = source["tipeBundling"];
	        this.diskonBundling = source["diskonBundling"];
	        this.produkIds = source["produkIds"];
	        this.produkX = source["produkX"];
	        this.produkY = source["produkY"];
	    }
	}
	export class UpdateStokRequest {
	    produkId: number;
	    stokBaru: number;
	    perubahan: number;
	    jenis: string;
	    keterangan: string;
	    tipeKerugian: string;
	    nilaiKerugian: number;
	    masaSimpanHari: number;
	    supplier: string;
	
	    static createFrom(source: any = {}) {
	        return new UpdateStokRequest(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.produkId = source["produkId"];
	        this.stokBaru = source["stokBaru"];
	        this.perubahan = source["perubahan"];
	        this.jenis = source["jenis"];
	        this.keterangan = source["keterangan"];
	        this.tipeKerugian = source["tipeKerugian"];
	        this.nilaiKerugian = source["nilaiKerugian"];
	        this.masaSimpanHari = source["masaSimpanHari"];
	        this.supplier = source["supplier"];
	    }
	}
	export class UpdateUserRequest {
	    id: number;
	    username: string;
	    password?: string;
	    namaLengkap: string;
	    role: string;
	    status: string;
	
	    static createFrom(source: any = {}) {
	        return new UpdateUserRequest(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.username = source["username"];
	        this.password = source["password"];
	        this.namaLengkap = source["namaLengkap"];
	        this.role = source["role"];
	        this.status = source["status"];
	    }
	}

}

