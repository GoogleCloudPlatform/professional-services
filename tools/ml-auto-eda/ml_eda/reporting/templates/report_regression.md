
# Exploratory Data Analysis Report

|**Dataset info:**||
|:-----|:-----|
|Number of features:|15 + 1 (target value)|
|Number of observations:|1000|
|Target value:|functional_weight|
|ML Problem type:|Regression|


* * *

## Descriptive Analysis

|**Features properties** | | |
|---|---|---|
|**native_country** <br/> *Categorical*| **Total count:** 32561 <br/> **Missing (%):** 1% <br/> <span style="color:red">**Cardinality:** 142 </span> | <img src="bar_chart_country.png" alt="Bar Chart Country" width="400px"/>|
|**education** <br/> *Categorical*| **Total count:** 45678 <br/> <span style="color:red"> **Missing (%):** 30% </span> <br/> **Cardinality:** 15 | <img src="bar_chart_education.png" alt="Bar Chart Education" width="400px"/>|
|**marital_status** <br/> *Categorical*| **Total count:** 54261 <br/> **Missing (%):** 0% <br/> **Cardinality:** 7 | <img src="bar_chart_marital.png" alt="Bar Chart Marital" width="400px"/>|
|**race** <br/> *Categorical*| **Total count:** 32561 <br/> **Missing (%):** 0% <br/> **Cardinality:** 5 | <img src="bar_chart_race.png" alt="Bar Chart Race" width="400px"/>|
| | | |
|**hours_per_week** <br/> *Numerical*| **Total count:** 32561 <br/> **Missing (%):** 0% <br/> **Mean:** 40.44 <br/> **Std:** 12.35 <br/> **Min:** 1.00 <br/> **Max:** 99.00 <br/> **Qantile 25:** 40.00 <br/> **Median:** 45.00 <br/> **Qantile 75:** 99.00 <br/> **Qantile 95:** 99.00 <br/> **Skewness:** 0.227643| <img src="histogram_chart_hours.png" alt="Histogram Chart Hours" width="400px"/>|
|**capital_gain** <br/> *Numerical*| **Total count:** 32561 <br/> **Missing (%):** 0% <br/> **Mean:** 236769.00 <br/> **Std:** 2367.00 <br/> **Min:** 12285.00 <br/> **Max:** 1484705.00 <br/> **Qantile 25:** 178309.00 <br/> **Median:** 236769.00 <br/> **Qantile 75:** 1484705.00 <br/> **Qantile 95:** 1484705.00 <br/> <span style="color:red"> **Skewness:** 1.446980 </span>| <img src="histogram_chart_weight.png" alt="Histogram Chart Weight" width="400px"/>|
|**age** <br/> *Numerical*| **Total count:** 32561 <br/> **Missing (%):** 0% <br/> **Mean:** 38.58 <br/> **Std:** 13.64 <br/> **Min:** 17.00 <br/> **Max:** 90.00 <br/> **Qantile 25:** 37.00 <br/> **Median:** 48.00 <br/> **Qantile 75:** 90.00 <br/> **Qantile 95:** 90.00 <br/> **Skewness:** 0.558743| <img src="histogram_chart_age.png" alt="Histogram Chart Age" width="400px"/>|

### Warnings:

* *native_country* has a **high cardinality**: 142 distinct values
* *education* has 30% **missing values**
* *capital_gain* is **highly skewed** (&gamma;1 = 1.446980)

* * *
## Correlation Analysis between features

* * *
### Correlation between numerical features

#### Pearson correlation

&#x200B;|capital_gain|age|hours_per_week
:-----:|:-----:|:-----:|:-----:
**capital_gain**|1.0|<span style="color:red">-0.07665</span>|-0.01877
**age**|<span style="color:red">-0.07665</span>|1.0|0.06876
**hours_per_week**|-0.01877|0.06876|1.0


#### Correlation heatmap

<img src="correlation.png" alt="Correlation" width="600px"/>

#### Warnings:

* *age* is **highly correlated** with *capital_gain* (&rho; = -0.0766458660364151)

* * *
### Correlation between categorical features

#### Contingency Tables

##### marital_status / education

&#x200B;| 10th| 11th| 12th| 1st-4th| 5th-6th| 7th-8th| 9th| Assoc-acdm| Assoc-voc| Bachelors| Doctorate| HS-grad| Masters| Preschool| Prof-school| Some-college
:-----:|:-----:|:-----:|:-----:|:-----:|:-----:|:-----:|:-----:|:-----:|:-----:|:-----:|:-----:|:-----:|:-----:|:-----:|:-----:|:-----:
**Divorced**|120|130|39|10|20|73|64|203|234|546|33|1613|233|1|55|1069
**Married-AF-spouse**|0|0|0|0|0|0|0|2|1|4|0|13|0|0|0|3
**Married-civ-spouse**|349|354|130|81|172|359|230|460|689|2768|286|4845|1003|20|412|2818
**Married-spouse-absent**|15|19|8|12|20|14|9|12|13|68|7|121|17|4|3|76
**Never-married**|361|586|232|39|89|113|155|337|362|1795|73|3089|404|22|93|2933
**Separated**|49|48|14|9|18|23|33|30|42|92|7|406|25|1|8|220
**Widowed**|39|38|10|17|14|64|23|23|41|82|7|414|41|3|5|172

<br/>

##### marital_status / race

&#x200B;| Amer-Indian-Eskimo| Asian-Pac-Islander| Black| Other| White
:-----:|:-----:|:-----:|:-----:|:-----:|:-----:
**Divorced**|60|75|485|26|3797
**Married-AF-spouse**|0|0|1|0|22
**Married-civ-spouse**|116|508|837|105|13410
**Married-spouse-absent**|9|41|62|15|291
**Never-married**|103|372|1346|105|8757
**Separated**|11|19|265|13|717
**Widowed**|12|24|128|7|822

<br/>

##### race / education

&#x200B;| 10th| 11th| 12th| 1st-4th| 5th-6th| 7th-8th| 9th| Assoc-acdm| Assoc-voc| Bachelors| Doctorate| HS-grad| Masters| Preschool| Prof-school| Some-college
:-----:|:-----:|:-----:|:-----:|:-----:|:-----:|:-----:|:-----:|:-----:|:-----:|:-----:|:-----:|:-----:|:-----:|:-----:|:-----:|:-----:
**Amer-Indian-Eskimo**|16|14|5|4|2|9|5|8|19|21|3|119|5|0|2|79
**Asian-Pac-Islander**|13|21|9|5|18|11|9|29|38|289|28|226|88|6|41|208
**Black**|133|153|70|16|21|56|89|107|112|330|11|1174|86|5|15|746
**Other**|9|10|14|9|13|17|8|8|6|33|2|78|7|2|4|51
**White**|762|977|335|134|279|553|403|915|1207|4682|369|8904|1537|38|514|6207

<br/>

#### Information Gain

IG|race|education|marital_status
:-----:|:-----:|:-----:|:-----:
**race**|NA|0.01490|0.01855
**education**|0.01490|NA|0.03451
**marital_status**|0.01855|0.03451|NA

#### Chi-square Statistical Test

chi / p-value|race|education|marital_status
:-----:|:-----:|:-----:|:-----:
**race**|NA|0.0 / 0.0|0.0 / 0.23
**education**|0.0/ 0.23|NA|<span style="color:red">1045.8 / 0.23</span>
**marital_status**|0.0 / 0.23|<span style="color:red">1045.8 / 0.23</span>|NA

<br/>

#### Warnings:
* *education* is **highly correlated** with *marital_status* (&chi; = 1045.8, p-value=0.23)

<br/>

* * *
### Correlation between categorical and numerical features

#### Descriptive Tables

##### hours_per_week / race

&#x200B;|Missing|Total count|Mean|Std|Min|Quantile 25|Median|Quantile 75|Quantile 95|Max
:-----:|:-----:|:-----:|:-----:|:-----:|:-----:|:-----:|:-----:|:-----:|:-----:|:-----:
**Black**|0.00|3124.00|38.42|10.32|1.00|40.00|40.00|99.00|99.00|99.00
**Asian-Pac-Islander**|0.00|1039.00|40.13|12.56|1.00|40.00|40.00|99.00|99.00|99.00
**White**|0.00|27816.00|40.69|12.54|1.00|40.00|45.00|99.00|99.00|99.00
**Amer-Indian-Eskimo**|0.00|311.00|40.05|11.70|3.00|40.00|40.00|84.00|84.00|84.00
**Other**|0.00|271.00|39.47|11.14|5.00|40.00|40.00|98.00|98.00|98.00

<br/>

##### age / marital_status

&#x200B;|Missing|Total count|Mean|Std|Min|Quantile 25|Median|Quantile 75|Quantile 95|Max
:-----:|:-----:|:-----:|:-----:|:-----:|:-----:|:-----:|:-----:|:-----:|:-----:|:-----:
**Married-civ-spouse**|0.00|14976.00|43.25|12.06|17.00|42.00|51.00|90.00|90.00|90.00
**Married-AF-spouse**|0.00|23.00|32.48|11.61|19.00|30.00|35.00|75.00|75.00|75.00
**Never-married**|0.00|10683.00|28.15|10.01|17.00|25.00|32.00|90.00|90.00|90.00
**Divorced**|0.00|4443.00|43.04|10.40|18.00|42.00|50.00|90.00|90.00|90.00
**Separated**|0.00|1025.00|39.35|10.84|18.00|38.00|46.00|90.00|90.00|90.00
**Married-spouse-absent**|0.00|418.00|40.58|12.40|18.00|40.00|48.00|80.00|80.00|80.00
**Widowed**|0.00|993.00|58.98|12.35|18.00|60.00|67.00|90.00|90.00|90.00

<br/>

##### capital_gain / education

&#x200B;|Missing|Total count|Mean|Std|Min|Quantile 25|Median|Quantile 75|Quantile 95|Max
:-----:|:-----:|:-----:|:-----:|:-----:|:-----:|:-----:|:-----:|:-----:|:-----:|:-----:
**9th**|0.00|514.00|202485.06|112131.98|22418.00|183096.00|245090.00|758700.00|758700.00|758700.00
**10th**|0.00|933.00|196832.47|109165.23|21698.00|179715.00|245317.00|766115.00|766115.00|766115.00
**11th**|0.00|1175.00|194928.08|103539.84|19752.00|184335.00|245918.00|806316.00|806316.00|806316.00
**12th**|0.00|433.00|199097.52|124754.56|23037.00|180039.00|255969.00|917220.00|917220.00|917220.00
**1st-4th**|0.00|168.00|239303.00|124869.98|34378.00|211032.00|311974.00|795830.00|795830.00|795830.00
**5th-6th**|0.00|333.00|232448.33|108561.93|32896.00|217838.00|289886.00|684015.00|684015.00|684015.00
**7th-8th**|0.00|646.00|188079.17|105692.98|20057.00|182715.00|241013.00|750972.00|750972.00|750972.00
**HS-grad**|0.00|10501.00|189538.73|103951.49|19214.00|177374.00|232855.00|1268339.00|1268339.00|1268339.00
**Masters**|0.00|1723.00|179852.36|97293.64|20179.00|170871.00|218676.00|704108.00|704108.00|704108.00
**Assoc-voc**|0.00|1382.00|181936.02|104710.45|20098.00|174463.00|231912.00|1366120.00|1366120.00|1366120.00
**Bachelors**|0.00|5355.00|188055.92|105199.03|19302.00|177550.00|234298.00|1226583.00|1226583.00|1226583.00
**Doctorate**|0.00|413.00|186698.77|103838.02|19520.00|174215.00|231495.00|606111.00|606111.00|606111.00
**Preschool**|0.00|51.00|235889.38|114191.30|69911.00|225065.00|277700.00|572751.00|572751.00|572751.00
**Assoc-acdm**|0.00|1067.00|193424.09|104905.18|19302.00|182437.00|236938.00|1455435.00|1455435.00|1455435.00
**Prof-school**|0.00|576.00|185663.70|92925.04|14878.00|177240.00|226443.00|747719.00|747719.00|747719.00
**Some-college**|0.00|7291.00|188742.92|107710.41|12285.00|177787.00|238474.00|1484705.00|1484705.00|1484705.00

#### ANOVA Statistical Test

f-statistic/p-value|capital_gain|age|hours_per_week
:-----:|:-----:|:-----:|:-----:
**race**|256.26917 / 0.0005|127.49600 / 0.5671|49.63432 / 0.5671
**education**|26.23605 / 0.5671|<span style="color:red">169.01572 / 0.23</span>|87.70061 / 0.5671
**marital_status**|16.13149 / 0.5671|2880.54541 / 0.5671|419.87222 / 0.5671

#### Warnings:
* *education* is **highly correlated** with *age* (f-statistic = 169.01572, p-value=0.23)

* * *
## Correlation Analysis between features and target value

**Terget value:** functional_weight

* * *
### Numerical features and target value

#### Pearson correlation

functional_weight|&rho;
:-----:|:-----:|
**capital_gain**|0.06876
**age**|<span style="color:red">-0.07665</span>
**hours_per_week**|-0.01877

#### Correlation heatmap

<img src="correlation_target.png" alt="Correlation" width="600px"/>

#### Warnings:

* *age* is **not correlated** with target value *functional_weight* (&rho; = -0.0766458660364151)

* * *
### Categorical features and target value

#### t-tests

functional_weight|t-statistic|p-value|
:-----:|:-----:|:-----:|
**race**|1.70751|<span style="color:red">8.773666e-02</span>
**education**|-43.436244|<span style="color:green">0.000000e+00</span>
**marital_status**|-42.583873|<span style="color:green">0.000000e+00</span>


#### ANOVA Statistical Test

functional_weight|f-statistic|p-value|
:-----:|:-----:|:-----:|
**race**|2.915594|<span style="color:red">8.773666e-02<span style="color:red">
**education**|-1886.707314|<span style="color:green">0.000000e+00</span>
**marital_status**|1813.386282|<span style="color:green">0.000000e+00</span>

#### Warnings:
* *marital_status* is **not correlated** with target value *functional_weight* (t-statistic=1.70751, f-statistic = 2.915594, p-value=8.773666e-02)

* * *
## Summary

### Warnings
* *native_country* has a **high cardinality**: 142 distinct values
* *education* has 30% **missing values**, is **highly correlated** with *marital_status* (&chi; = 1045.8, p-value=0.23), is **highly correlated** with *age* (f-statistic = 169.01572, p-value=0.23)
* *capital_gain* is **highly skewed** (&gamma;1 = 1.446980), is **not correlated** with target value *functional_weight* (t-statistic=1.70751, f-statistic = 2.915594, p-value=8.773666e-02)
* *age* is **highly correlated** with *capital_gain* (&rho; = -0.0766458660364151)
* *marital_status* is **not correlated** with target value *functional_weight* (t-statistic=1.70751, f-statistic = 2.915594, p-value=8.773666e-02)

### Recommended features
* *capital_gain* (**highly correlated** with target value *functional_weight*)
* *age*
* *race*

