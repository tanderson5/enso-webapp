# Data folder
This folder contains data that was used to develop and test this web application.

## raw_data
The original datasets the model was built and trained around. Both files are assumed to end in June 2021. 
### OHC_Observation.txt
This file contains ocean heat content (OHC) data from June 1958 to June 2021. The first column is the time the observation was made and is followed by PC columns. This web app extracts both the time and PC1 columns.
### Tropical_IndoPacific_30S_30N_PC1_1950_2021_EE_Earth_final_ML_PC1_PC10_detred_rev1.csv
This file contains sea surface temperature (SST) data. It contains 10 PC columns from PC1 to PC10. It is assumed that both of these data files end with June 2021. Therefore, since this file has 853 rows (months), it is assumed to start in May of 1950. This web app extracts the PC1 content and aligns with the OHC data by matching the latest data in pairs. The time from the OHC data is then used.

## NOAA_data
Updated datasets sourced directly from NOAA, suitable for generating current forecasts. These files can be re-downloaded from the links below to get the most recent data.
### sstoi.indices: https://www.cpc.ncep.noaa.gov/data/indices/sstoi.indices
This dataset contains SST data. It contains SST data from January 1982 to present. It has 10 columns:
- `YR MON NINO1+2 ANOM NINO3 ANOM NINO4 ANOM NINO3.4 ANOM`

The web app uses the final ANOM column (NINO3.4 anomaly), which is comparable to the PC1 values in the raw SST file.

### heatcentra.csv: https://psl.noaa.gov/data/correlation/heatcentra.csv
This dataset contains central pacific heat content data with non-null values from January 1979 to present. Contains a `Date` column (YYYY-MM-DD) followed by the OHC value.

> **Note:** Use these two NOAA files together. Do not mix them with the raw_data files above, as the different time formats and baselines will cause alignment errors.


## Manual Entry - June 2026 Data.txt
**The data in this file should only be used for manual entry and the file should not be uploaded directly to the web application.**

Contains the latest 18 months (January 2025 – June 2026) extracted from the NOAA datasets above, formatted for pasting into the manual entry fields:

- **SST:** NINO3.4 ANOM from https://www.cpc.ncep.noaa.gov/data/indices/sstoi.indices
- **OHC:** Central Pacific heat content from https://psl.noaa.gov/data/correlation/heatcentra.csv