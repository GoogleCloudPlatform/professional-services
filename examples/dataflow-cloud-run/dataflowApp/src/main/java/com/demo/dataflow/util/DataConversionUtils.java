package com.demo.dataflow.util;


import java.text.DateFormat;
import java.text.SimpleDateFormat;
import java.util.Date;

public class DataConversionUtils {

    public static Date getDateFromString(String format, String inDate) throws Exception{
        DateFormat formatter = new SimpleDateFormat(format);
        Date date = formatter.parse(inDate);
        return date;
    }


}
