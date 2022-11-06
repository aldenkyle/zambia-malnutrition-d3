# -*- coding: utf-8 -*-
"""
Created on Sat Oct 22 20:36:42 2022

@author: kylea
"""

import pandas as pd
import requests

import json
from pandas.io.json import json_normalize

with open(r"C:\Users\kylea\Documents\GIS Projects\GEOG575\d3-lab\data\location-hierarchy.json", encoding="utf-8") as json_data:
    data = json.load(json_data)

df = pd.DataFrame(data['children'])

df_zambia = pd.DataFrame(df.children[192])


adm1_list = df_zambia.name.to_list()
df2 = pd.DataFrame()
index_c = 0
for adm1 in adm1_list:
    df_adm2 = pd.DataFrame(df_zambia.children[index_c])
    df_adm2['adm1'] = adm1
    df_adm2['adm0'] = 'Zambia'
    index_c = index_c + 1
    df2 = pd.concat([df_adm2,df2])



loc_id_list = df2.location_id.to_list()

stunting_dfs = pd.DataFrame()
for locid in loc_id_list:
    url = 'https://vizhub.healthdata.org/lbd/api/v1/themes/cgf/schemas/cgf/info/aggregate/components/0?age=A1&location_id='+locid+'&risk=stunting&sex=S3&stat=mean&year=2018'
    header = {
      "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/50.0.2661.75 Safari/537.36",
      "X-Requested-With": "XMLHttpRequest"
    }
    r = requests.get(url, headers=header)
    df_stunting = pd.read_json(r.text)
    df_stunting['locid'] = locid
    stunting_dfs = pd.concat([df_stunting,stunting_dfs])


stunting_dfs.to_csv(r"C:\Users\kylea\Documents\GIS Projects\GEOG575\d3-lab\data\zambia_stunting_loc_ids.csv")

wasting_dfs = pd.DataFrame()
for locid in loc_id_list:
    url = 'https://vizhub.healthdata.org/lbd/api/v1/themes/cgf/schemas/cgf/info/aggregate/components/0?age=A1&location_id='+locid+'&risk=wasting&sex=S3&stat=mean&year=2018'
    header = {
      "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/50.0.2661.75 Safari/537.36",
      "X-Requested-With": "XMLHttpRequest"
    }
    r = requests.get(url, headers=header)
    df_wasting = pd.read_json(r.text)
    df_wasting['locid'] = locid
    wasting_dfs = pd.concat([df_wasting,wasting_dfs])


wasting_dfs.to_csv(r"C:\Users\kylea\Documents\GIS Projects\GEOG575\d3-lab\data\zambia_wasting_loc_ids.csv")


underweight_dfs = pd.DataFrame()
for locid in loc_id_list:
    url = 'https://vizhub.healthdata.org/lbd/api/v1/themes/cgf/schemas/cgf/info/aggregate/components/0?age=A1&location_id='+locid+'&risk=underweight&sex=S3&stat=mean&year=2018'
    header = {
      "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/50.0.2661.75 Safari/537.36",
      "X-Requested-With": "XMLHttpRequest"
    }
    r = requests.get(url, headers=header)
    df_wasting = pd.read_json(r.text)
    df_wasting['locid'] = locid
    underweight_dfs = pd.concat([df_wasting,underweight_dfs])


underweight_dfs.to_csv(r"C:\Users\kylea\Documents\GIS Projects\GEOG575\d3-lab\data\zambia_underw_loc_ids.csv")