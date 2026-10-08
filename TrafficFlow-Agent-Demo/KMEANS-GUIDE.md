# TrafficFlow — Offline Application and English Guide

## 1. Open the application

1. Right-click `TrafficFlow-Agent-Demo.zip` and select **Extract All**.
2. Open the extracted `TrafficFlow-Agent-Demo` folder.
3. Double-click **KMeans-Predictor.html**. If necessary, right-click it and select **Open with > Google Chrome** or **Microsoft Edge**.
4. The application trains its built-in model and displays the default prediction automatically.

No internet connection, server, Python installation, API key or account is needed to run the application. All application text is in English. Keep a copy of the extracted folder on your laptop or USB drive for your project review.

## 2. Give a three-minute demonstration

1. Show the default **High** congestion result.
2. Click the **Low**, **Moderate**, **High** and **Severe** sample buttons to demonstrate different conditions.
3. Enter your own vehicle count, speed, density and occupancy. Select the location and observation time, then click **Predict congestion**.
4. Choose a 15-, 30- or 60-minute horizon and run the prediction again. Show the **What comes next** estimate and preventive suggestions.
5. Show the **Traffic clusters** chart and **Congestion patterns** section.
6. Expand **Model, dataset & project implementation** to explain training, cluster centers and the silhouette score.
7. Upload the included `sample-traffic.csv` to demonstrate model retraining. Your own observations can use the same format.
8. Click **Save result** to download the latest prediction and inputs as a JSON report.

After changing inputs, click **Predict congestion** to update the result. The sample scenario buttons update it immediately.

## 3. Sample inputs

| Scenario | Vehicles / 5 min | Speed km/h | Density vehicles/km | Occupancy % |
|---|---:|---:|---:|---:|
| Low | 75 | 60 | 15 | 12 |
| Moderate | 180 | 42 | 45 | 35 |
| High | 340 | 24 | 90 | 65 |
| Severe | 510 | 8 | 150 | 90 |

These labels were verified with the built-in model. A custom dataset can produce different assignments because the model learns new clusters.

## 4. Explain the project during your review

“Our application accepts traffic observations, validates them, and standardizes vehicle count, average speed, density and occupancy. We train K-Means with four clusters. Each new observation is assigned to its nearest centroid. We order the centroids by traffic intensity and label them Low, Moderate, High and Severe. The application displays the result, traffic patterns and preventive suggestions. A separate historical-profile method estimates conditions ahead and reclassifies them.”

**Be clear about the scope:** this is a working K-Means implementation with simulated built-in data. It is an academic demonstration, not a live traffic service or a validated real-world forecasting system. K-Means groups similar conditions; the future estimate uses a separate time-pattern calculation.

## 5. Implementation aligned with the PPT

Your source deck has 15 slides. Its objective/architecture mention three levels in places; slides 10 and 13 explicitly use four, so this application uses **K = 4**.

| PPT module | Implemented in this app |
|---|---|
| Traffic Data Collection | Manual inputs and browser-local CSV upload; reproducible simulated history |
| Data Preprocessing | Required columns, units/ranges, empty values, time validation; z-score standardization |
| K-Means Clustering | K-Means++ initialization, 5 runs, maximum 100 iterations; lowest-inertia run retained |
| Congestion Prediction | Nearest learned centroid for new inputs; four relative congestion labels |
| Prevention & Alerts | Level-based suggestions, projected worsening message, unusual-input warning |
| Traffic Pattern Analysis | Density/speed scatter, hourly patterns, congestion share by location |
| System Evaluation | Sample silhouette, centroid table, row count and iteration count |

The architecture image also mentions IoT sensors, GPS, weather logs and signal control. Those external integrations are **not implemented**. The application does not switch real traffic lights, access GPS or calculate verified alternate routes. Literature survey claims in the supplied deck have not been independently verified and are not treated as this app's measured performance.

## 6. Data and model details

- Training source: 2,016 deterministic simulated readings = 7 days × 96 quarter-hour slots × 3 fictional road locations.
- Roads: Central Junction, Station Road and Market Road are illustrative names, not live monitored places.
- Four numerical features: vehicles per five-minute window, speed in km/h, total density in vehicles/km for the observed road section, occupancy in percent.
- Mean and standard deviation are fitted only on training observations and reused for new inputs. Constant features use a scale of 1.
- Euclidean distance is calculated in standardized four-dimensional space.
- Cluster naming: sort centroids by `z(vehicle count) - z(speed) + z(density) + z(occupancy)`. Names describe relative groups in the supplied dataset, not externally validated congestion thresholds.
- Built-in training: 13 iterations in the selected run; sampled silhouette approximately **0.532**. Silhouette is cluster separation, not 53.2% accuracy.
- No labeled test set was supplied. No precision, recall, accuracy or real-world forecast accuracy is claimed.
- A warning appears when input-to-centroid distance exceeds its cluster's 97.5th-percentile training distance (minimum threshold 0.5 scaled units).
- Future estimate: for the chosen location, use distance-weighted averages of readings within ±30 minutes of current and future times. Add the difference to the user's readings, clamp to the supported range, then classify. At least two readings per window are required. Time wraps across midnight. Weekdays and dates are pooled; no date-specific prediction is made.
- Training and uploads exist only in the current tab. Refreshing restores the simulated model. No uploaded file is sent to a server.

## 7. Train using your own CSV

Required header:

```csv
location,time,vehicles,speed,density,occupancy
Central Junction,17:00,340,24,90,65
```

Provide **40–5,000 rows**, at most **2 MB**, with at least four distinct numeric observations. Keep all readings in consistent units and comparable road sections. A file with missing or invalid values is rejected; the previous trained model stays available.

Supported ranges: vehicles 0–600 (integer), speed 0–100 km/h, density 0–200 vehicles/km, occupancy 0–100%. `time` uses 24-hour `HH:mm`. Location is a nonempty name of at most 80 characters. Other CSV columns are ignored by the model.

Sparse time data can still train the current-condition classifier, but the app withholds future estimates when the relevant time windows lack data. For a credible next project stage, collect timestamped observations from comparable roads, define congestion labels independently, and evaluate future estimates using a chronological holdout dataset.

## 8. Source files

- `KMeans-Predictor.html`: self-contained offline application. This is the file to open for your demo.
- `sample-traffic.csv`: simulated dataset for demonstrating upload/retraining.
- `kmeans-source/model.js`: K-Means, validation, synthetic data, CSV handling and forecast logic.
- `kmeans-source/ui.js`: application interactions and result display.
- `kmeans-source/page.html`: editable page layout, with script placeholders.
- `kmeans-source/build.py`: rebuilds the offline HTML using Python standard library only.
- `kmeans-source/test-model.cjs`: algorithm checks; run with Node.js if available.

The completed application uses plain HTML, CSS and JavaScript, with no third-party runtime dependency.

## 9. Edit and rebuild the source code

Running the finished application requires only a browser. Rebuilding after source edits requires Python 3; the optional model checks require Node.js. No additional packages are needed.

1. Open the `source` folder in your code editor.
2. Edit `page.html` for layout and styling, `ui.js` for interface behavior, or `model.js` for data and algorithm logic.
3. Open a terminal in the extracted `TrafficFlow-Agent-Demo` folder.
4. Run:

```text
python kmeans-source/build.py
```

On Windows, if `python` is unavailable but the Python launcher is installed, use:

```text
py kmeans-source/build.py
```

5. Reopen or refresh `KMeans-Predictor.html` to see the rebuilt application.

Do not open `kmeans-source/page.html` as the finished app: it contains script placeholders. The build combines the source files into the self-contained `KMeans-Predictor.html`. Rebuilding overwrites that generated file, so make lasting changes in the source files.

Optional algorithm checks:

```text
node kmeans-source/test-model.cjs
```

The checks cover the four built-in classes, CSV round-trip parsing, invalid values, insufficient training data, midnight rollover, missing time history and nearest-centroid assignment. Passing these checks does not establish real-world predictive accuracy.

## 10. Troubleshooting

| Problem | What to do |
|---|---|
| The file opens as text | Right-click `KMeans-Predictor.html` and choose Chrome or Edge. |
| The application does not run inside the ZIP preview | Extract the ZIP first, then open the HTML file. |
| Results do not change after editing values | Click **Predict congestion** and check for invalid or missing fields. |
| A CSV is rejected | Check the required headers, supported ranges, time format, row count and file size described above. |
| No future estimate appears | Add enough observations near both time windows for the selected location. Current-condition classification remains available. |
| Custom training disappears after refresh | This is expected: training stays in the current browser tab. Upload the CSV again. |
| The result looks unexpected | Check units and input consistency. Cluster labels are relative to the training data; inspect the cluster centers. |
| Python or Node.js is unavailable | Use the finished `KMeans-Predictor.html` directly. These tools are needed only for rebuilding or optional source checks. |

## 11. Questions you may be asked

**Why K = 4?** The proposed-system and algorithm slides use Low, Moderate, High and Severe. This demo fixes K to four to match those slides; it does not automatically select the best K.

**Why standardize the inputs?** The features have different units and numerical ranges. Standardization reduces the effect of scale on Euclidean distance.

**Does the model use labels during training?** No. K-Means is unsupervised. The application assigns readable congestion names after ordering the learned centroids.

**Is the silhouette score accuracy?** No. It measures cluster separation. Accuracy would require independent ground-truth labels and an evaluation design.

**Is prevention automatic?** No. The app provides suggestions; it does not operate traffic lights or verify road alternatives.

**What would make this a real deployment?** Real traffic feeds, consistent sensor calibration, independent congestion labels, chronological forecast evaluation, and validated routing or traffic-control integrations.
