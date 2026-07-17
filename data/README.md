# Data folder
This folder contains data that was used to develop and test this web application.

## raw_data
This data is what the web app was intially built around and tested with. 
### OHC_Observation.txt
This file contains ocean heat content (OHC) data from June 1958 to June 2021. The first column is the time the observation was made and is followed by PC columns. This web app extracts both the time and PC1 columns.
### Tropical_IndoPacific_30S_30N_PC1_1950_2021_EE_Earth_final_ML_PC1_PC10_detred_rev1.csv
This file contains sea surface temperature (SST) data. It contains 10 PC columns from PC1 to PC10. It is assumed that both of these data files end with June 2021. Therefore, since this file has 853 rows (months), it is assumed to start in May of 1950. This web app extracts the PC1 content and aligns with the OHC data by matching the latest data in pairs. The time from the OHC data is then used.

## Manual Entry - June 2026 Data.txt
**The data in this file should only be used for manual entry and the file should not be uploaded directly to the web application.**

This data was extracted from the NOAA datasets listed below:
- Nino 3.4 ANOM (SST): https://www.cpc.ncep.noaa.gov/data/indices/sstoi.indices
- Central Pacific heat content (OHC): https://psl.noaa.gov/data/correlation/heatcentra.csv

The latest 18 months (January 2025 - June 2026) were taken from these datasets and used as SST and OHC data respectively.