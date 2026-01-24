import { ChevronDown, ChevronUp, Search, Settings, Video } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { fetchInstruments, setSelectedExchange, setSelectedType } from "../../marketSlice";
import { selectSelectedExchange, selectSelectedType } from "../../marketSelectors";
import type { MarketSymbolType } from "../../marketTypes";
import styles from "./MarketBoard.module.scss";

export default function MarketToolBar() {
  const dispatch = useAppDispatch();
  const selectedExchange = useAppSelector(selectSelectedExchange);
  const selectedType = useAppSelector(selectSelectedType);

  const handleExchangeClick = (exchange: string) => {
    dispatch(setSelectedExchange(exchange));
    dispatch(setSelectedType('STOCK')); // Khi chọn sàn thì mặc định hiện cổ phiếu
    dispatch(fetchInstruments(exchange));
  };

  const handleTypeClick = (type: MarketSymbolType) => {
    dispatch(setSelectedType(type));
  };

  return (
    <div className={styles.marketToolBar}>
      <div className={styles.toolBarLeft}>
        <div className={styles.searchBox}>
          <Search className={styles.icon} />
          <input type="text" placeholder="Tìm mã CK" />
        </div>

        <div className={styles.dropdownBtn}>
          Danh sách theo dõi <ChevronDown className={styles.icon} />
        </div>

        <div className={styles.marketTabs}>
          {['HOSE', 'HNX', 'UPCOM'].map((ex) => (
            <div
              key={ex}
              className={`${styles.tab} ${selectedExchange === ex && (selectedType === 'STOCK' || selectedType === 'ALL') ? styles.active : ""}`}
              onClick={() => handleExchangeClick(ex)}
            >
              {ex}
            </div>
          ))}
        </div>

        <div className={`${styles.marketTabs} ${styles.secondaryTabs}`}>
          <div
            className={`${styles.tab} ${selectedType === 'WARRANT' ? styles.active : ""}`}
            onClick={() => handleTypeClick('WARRANT')}
          >
            Chứng quyền
          </div>
          <div
            className={`${styles.tab} ${selectedType === 'ETF' ? styles.active : ""}`}
            onClick={() => handleTypeClick('ETF')}
          >
            ETF
          </div>
        </div>
      </div>

      <div className={styles.toolBarRight}>
        {/* <div className={styles.dropdownBtn}>
          Analysis Tools <ChevronDown className={styles.icon} />
        </div> */}
        <div className={styles.dropdownBtn}>
          Buy In <ChevronDown className={styles.icon} />
        </div>
        <div className={styles.iconBtn} title="Chế độ trình chiếu"><Video className={styles.icon} /></div>
        <div className={styles.iconBtn} title="Cài đặt"><Settings className={styles.icon} /></div>
        <div className={styles.iconBtn} title="Thu gọn"><ChevronUp className={styles.icon} /></div>
      </div>
    </div>
  );
}
