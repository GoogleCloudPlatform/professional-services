/*
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

package com.google.example;

import com.google.auto.value.AutoValue;
import java.util.HashMap;
import java.util.Map;
import javax.annotation.Nullable;
import org.apache.beam.sdk.Pipeline;
import org.apache.beam.sdk.io.TextIO;
import org.apache.beam.sdk.options.PipelineOptionsFactory;
import org.apache.beam.sdk.schemas.AutoValueSchema;
import org.apache.beam.sdk.schemas.Schema;
import org.apache.beam.sdk.schemas.annotations.DefaultSchema;
import org.apache.beam.sdk.schemas.annotations.SchemaCaseFormat;
import org.apache.beam.sdk.transforms.MapElements;
import org.apache.beam.sdk.transforms.SerializableFunction;
import org.apache.beam.sdk.transforms.ToJson;
import org.apache.beam.sdk.values.PCollection;
import org.apache.beam.sdk.values.PCollectionRowTuple;
import org.apache.beam.sdk.values.Row;
import org.apache.beam.sdk.values.TypeDescriptor;
import org.apache.beam.vendor.guava.v26_0_jre.com.google.common.base.CaseFormat;
import com.google.example.csvio.CSVIO;
import com.google.example.csvio.CSVIOReadConfiguration;
import com.google.example.csvio.CSVRecordToRow;

/**
 * An example demonstrating the use of {@link CSVIO.Read} with the Metropolatan Museum of Art
 * BigQuery public dataset exported to CSV files.
 */
public class ExampleRead {

  private static final String MET_IMAGES_HEADER = "object_id,public_caption,title,original_image_url,caption,is_oasc,gcs_url";
  private static final String MET_OBJECTS_HEADER = "object_number,is_highlight,is_public_domain,object_id,department,object_name,title,culture,period,dynasty,reign,portfolio,artist_role,artist_prefix,artist_display_name,artist_display_bio,artist_suffix,artist_alpha_sort,artist_nationality,artist_begin_date,artist_end_date,object_date,object_begin_date,object_end_date,medium,dimensions,credit_line,geography_type,city,state,county,country,region,subregion,locale,locus,excavation,river,classification,rights_and_reproduction,link_resource,metadata_date,repository";
  private static final AutoValueSchema AUTO_VALUE_SCHEMA = new AutoValueSchema();
  private static final Map<String, Schema> HEADER_SCHEMA_REGISTRY = new HashMap<>() {{
    this.put(MET_IMAGES_HEADER, MetImage.getSchema());
    this.put(MET_OBJECTS_HEADER, MetObject.getSchema());
  }};

  public static void main(String[] args) {
    ExampleReadOptions options = PipelineOptionsFactory
        .fromArgs(args)
        .withValidation()
        .as(ExampleReadOptions.class);

    Pipeline p = Pipeline.create(options);

    CSVIOReadConfiguration configuration = CSVIOReadConfiguration.builder()
        .setFilePattern(options.getSource())
        .build();

    CSVIO.Read.Result readResult = p.apply(
        "ReadCSV",
        CSVIO.read()
            .setConfiguration(configuration)
            .build()
    );

    readResult.getFailure().apply(
        "ReadCSV/ErrorsToJson",
        ToJson.of()
    ).apply(
        "ReadCSV/WriteQuarantine",
        TextIO.write().to(options.getQuarantine())
    );

    CSVRecordToRow.Result csvRecordToRowResult = readResult.getSuccess().apply(
        "ParseCSV",
        CSVRecordToRow.builder()
            .setHeaderSchemaRegistry(HEADER_SCHEMA_REGISTRY)
            .build()
    );

    csvRecordToRowResult.getFailure().apply(
        "ParseCSV/ErrorsToJson",
        ToJson.of()
    ).apply(
        "ParseCSV/WriteQuarantine",
        TextIO.write().to(options.getQuarantine())
    );

    PCollectionRowTuple pcrt = csvRecordToRowResult.getSuccess();
    PCollection<Row> imageRows = pcrt.get(MET_IMAGES_HEADER);
    PCollection<Row> objectRows = pcrt.get(MET_OBJECTS_HEADER);

    PCollection<MetImage> images = imageRows.apply(
        "Serialize/MetImage",
        MapElements.into(
            TypeDescriptor.of(MetImage.class)
        ).via(MetImage.getFromRowSerializeableFunction())
    );

    PCollection<MetObject> objects = objectRows.apply(
        "Serialize/MetObject",
        MapElements.into(
            TypeDescriptor.of(MetObject.class)
        ).via(MetObject.getFromRowSerializeableFunction())
    );

    images.apply(
        "MetImage/ToJson",
        ToJson.of()
    ).apply(
        "MetImage/Write",
        TextIO.write().to(options.getSink() + "/images")
    );

    objects.apply(
        "MetObjects/ToJson",
        ToJson.of()
    ).apply(
        "MetObjects/Write",
        TextIO.write().to(options.getSink() + "/objects")
    );

    p.run();
  }

  /**
   * A representation of the Metropolitan Museum of Art BigQuery dataset's images table.
   */
  @DefaultSchema(AutoValueSchema.class)
  @SchemaCaseFormat(CaseFormat.LOWER_UNDERSCORE)
  @AutoValue
  static abstract class MetImage {

    private static final TypeDescriptor<MetImage> TYPE_DESCRIPTOR =
        TypeDescriptor.of(MetImage.class);
    private static final Schema SCHEMA = AUTO_VALUE_SCHEMA.schemaFor(TYPE_DESCRIPTOR);
    private static final SerializableFunction<Row, MetImage> FROM_ROW_SERIALIZABLE_FUNCTION
        = AUTO_VALUE_SCHEMA.fromRowFunction(TYPE_DESCRIPTOR);

    static Schema getSchema() {
      return SCHEMA;
    }

    static SerializableFunction<Row, MetImage> getFromRowSerializeableFunction() {
      return FROM_ROW_SERIALIZABLE_FUNCTION;
    }

    abstract Integer getObjectId();

    @Nullable
    abstract String getPublicCaption();

    @Nullable
    abstract String getTitle();

    abstract String getOriginalImageUrl();

    @Nullable
    abstract String getCaption();

    abstract Boolean getIsOasc();

    abstract String getGcsUrl();

    @AutoValue.Builder
    static abstract class Builder {

      abstract Builder setObjectId(Integer value);

      abstract Builder setPublicCaption(String value);

      abstract Builder setTitle(String value);

      abstract Builder setOriginalImageUrl(String value);

      abstract Builder setCaption(String value);

      abstract Builder setIsOasc(Boolean value);

      abstract Builder setGcsUrl(String value);

      abstract MetImage build();
    }
  }

  /**
   * A representation of the Metropolitan Museum of Art BigQuery dataset's objects table.
   */
  @DefaultSchema(AutoValueSchema.class)
  @SchemaCaseFormat(CaseFormat.LOWER_UNDERSCORE)
  @AutoValue
  static abstract class MetObject {

    private static final TypeDescriptor<MetObject> TYPE_DESCRIPTOR =
        TypeDescriptor.of(MetObject.class);
    private static final Schema SCHEMA = AUTO_VALUE_SCHEMA.schemaFor(TYPE_DESCRIPTOR);
    private static final SerializableFunction<Row, MetObject> FROM_ROW_SERIALIZABLE_FUNCTION
        = AUTO_VALUE_SCHEMA.fromRowFunction(TYPE_DESCRIPTOR);

    static Schema getSchema() {
      return SCHEMA;
    }

    static SerializableFunction<Row, MetObject> getFromRowSerializeableFunction() {
      return FROM_ROW_SERIALIZABLE_FUNCTION;
    }

    abstract String getObjectNumber();

    abstract Boolean getIsHighlight();

    abstract Boolean getIsPublicDomain();

    abstract Integer getObjectId();

    abstract String getDepartment();

    @Nullable
    abstract String getObjectName();

    @Nullable
    abstract String getTitle();

    @Nullable
    abstract String getCulture();

    @Nullable
    abstract String getPeriod();

    @Nullable
    abstract String getDynasty();

    @Nullable
    abstract String getReign();

    @Nullable
    abstract String getPortfolio();

    @Nullable
    abstract String getArtistRole();

    @Nullable
    abstract String getArtistPrefix();

    @Nullable
    abstract String getArtistDisplayName();

    @Nullable
    abstract String getArtistDisplayBio();

    @Nullable
    abstract String getArtistSuffix();

    @Nullable
    abstract String getArtistAlphaSort();

    @Nullable
    abstract String getArtistNationality();

    @Nullable
    abstract String getArtistBeginDate();

    @Nullable
    abstract String getArtistEndDate();

    @Nullable
    abstract String getObjectDate();

    abstract Integer getObjectBeginDate();

    abstract Integer getObjectEndDate();

    @Nullable
    abstract String getMedium();

    @Nullable
    abstract String getDimensions();

    abstract String getCreditLine();

    @Nullable
    abstract String getGeographyType();

    @Nullable
    abstract String getCity();

    @Nullable
    abstract String getState();

    @Nullable
    abstract String getCounty();

    @Nullable
    abstract String getCountry();

    @Nullable
    abstract String getRegion();

    @Nullable
    abstract String getSubregion();

    @Nullable
    abstract String getLocale();

    @Nullable
    abstract String getLocus();

    @Nullable
    abstract String getExcavation();

    @Nullable
    abstract String getRiver();

    @Nullable
    abstract String getClassification();

    @Nullable
    abstract String getRightsAndReproduction();

    abstract String getLinkResource();

    abstract String getMetadataDate();

    abstract String getRepository();

    @AutoValue.Builder
    static abstract class Builder {

      public abstract Builder setObjectNumber(String value);

      public abstract Builder setIsHighlight(Boolean value);

      public abstract Builder setIsPublicDomain(Boolean value);

      public abstract Builder setObjectId(Integer value);

      public abstract Builder setDepartment(String value);

      public abstract Builder setObjectName(String value);

      public abstract Builder setTitle(String value);

      public abstract Builder setCulture(String value);

      public abstract Builder setPeriod(String value);

      public abstract Builder setDynasty(String value);

      public abstract Builder setReign(String value);

      public abstract Builder setPortfolio(String value);

      public abstract Builder setArtistRole(String value);

      public abstract Builder setArtistPrefix(String value);

      public abstract Builder setArtistDisplayName(String value);

      public abstract Builder setArtistDisplayBio(String value);

      public abstract Builder setArtistSuffix(String value);

      public abstract Builder setArtistAlphaSort(String value);

      public abstract Builder setArtistNationality(String value);

      public abstract Builder setArtistBeginDate(String value);

      public abstract Builder setArtistEndDate(String value);

      public abstract Builder setObjectDate(String value);

      public abstract Builder setObjectBeginDate(Integer value);

      public abstract Builder setObjectEndDate(Integer value);

      public abstract Builder setMedium(String value);

      public abstract Builder setDimensions(String value);

      public abstract Builder setCreditLine(String value);

      public abstract Builder setGeographyType(String value);

      public abstract Builder setCity(String value);

      public abstract Builder setState(String value);

      public abstract Builder setCounty(String value);

      public abstract Builder setCountry(String value);

      public abstract Builder setRegion(String value);

      public abstract Builder setSubregion(String value);

      public abstract Builder setLocale(String value);

      public abstract Builder setLocus(String value);

      public abstract Builder setExcavation(String value);

      public abstract Builder setRiver(String value);

      public abstract Builder setClassification(String value);

      public abstract Builder setRightsAndReproduction(String value);

      public abstract Builder setLinkResource(String value);

      public abstract Builder setMetadataDate(String value);

      public abstract Builder setRepository(String value);

      abstract MetObject build();
    }
  }
}
