import '../styles/app.scss';

import axios from 'axios';

const BASE_URL =
  'https://water-monitoring.information.qld.gov.au/cgi/webservice.pl?';

const prettyPrintJson = require('pretty-print-json');
const LOADING = 'Loading ...';

const actionButtonElm = document.getElementById('actionButton');

const siteIdInputElm = document.getElementById('siteIdInput');

const latestVariableElm = document.getElementById('latestVariable');
const dataResponceElm = document.getElementById('dataResponce');
const apiGetLatestWaterDataElm = document.getElementById(
  'apiGetLatestWaterData'
);
const groupedLatestVariablesByVaribleElm = document.getElementById(
  'groupedLatestVariablesByVarible'
);

const getAvailableData = (responseData) => {
  const variables = getVariables(responseData);
  const groupedVaribles = groupVaribles(responseData);
  const groupedLatestVariablesByVarible = groupLatestVariablesByVarible(
    variables,
    groupedVaribles
  );

  groupedLatestVariablesByVaribleElm.innerHTML = prettyPrintJson.toHtml(
    groupedLatestVariablesByVarible
  );

  const apiGetLatestWaterDataQueryUrl =
    BASE_URL +
    JSON.stringify(apiGetLatestWaterDataQuery(groupedLatestVariablesByVarible));

  latestVariableElm.innerHTML = prettyPrintJson.toHtml(
    apiGetLatestWaterDataQueryUrl
  );

  apiGetLatestWaterData(apiGetLatestWaterDataQueryUrl);

  /* const timeoutGroupedLatestVariablesByVarible = setTimeout(() => {
    
    clearTimeout(timeoutGroupedLatestVariablesByVarible)
  }, 2000);

  timeoutGroupedLatestVariablesByVarible
   */
};

// getVariables
const getVariables = (data) => {
  const allVariblesVariable = [];
  data._return.map((item) => {
    const sites = item._return.sites[0];
    sites.variables.map((item) => allVariblesVariable.push(item.variable));
  });
  return [...new Set(allVariblesVariable)];
};

// grouped Varibles
const groupVaribles = (data) => {
  const allVaribles = [];

  allVaribles.concat(
    ['AT', 'A', 'ATQ'].forEach((dc, index) => {
      data._return[index]._return.sites[0].variables.map((item) => {
        return allVaribles.push({
          variable: item.variable,
          periodEnd: item.period_end,
          datasource: dc,
          site_id: data._return[index]._return.sites[0].site,
        });
      });
    })
  );

  return allVaribles;
};

const groupLatestVariablesByVarible = (variables, groupedVaribles) => {
  let latastPeriodEndDate = '';
  let datasource = '';
  let finalData = [];
  let site_id = null;

  variables.forEach((value) => {
    latastPeriodEndDate = '';

    groupedVaribles.filter((item) => {
      site_id = item.site_id;
      if (
        item.variable === value &&
        (latastPeriodEndDate < item.periodEnd || latastPeriodEndDate === '')
      ) {
        latastPeriodEndDate = item.periodEnd;
        datasource = item.datasource;
      }
    });
    finalData.push({ latastPeriodEndDate, datasource, value, site_id });
  });
  return finalData;
};

const nowDate = new Date();

// YYYYMMDDhhmmss
const formatedNowDate =
  nowDate.toISOString().slice(0, 10).replace(/-/g, '') +
  nowDate.toTimeString().slice(0, 8).replace(/:/g, '');

const apiGetLatestWaterDataQuery = (latestVaribles) => {
  return {
    function: 'multi_call',
    version: 1,
    params: {
      function_list: latestVaribles.map((item) => ({
        function: 'get_ts_traces',
        version: 2,
        params: {
          start_time: item.latastPeriodEndDate,
          end_time: formatedNowDate,
          site_list: item.site_id,
          var_list: item.value,
          datasource: item.datasource,
          interval: 'day',
          multiplier: 1,
          data_type: 'point',
          rel_times: 0,
        },
      })),
    },
  };
};

const firstQuery = (siteID) => ({
  function: 'multi_call',
  version: 1,
  params: {
    function_list: [
      {
        function: 'get_variable_list',
        version: 1,
        params: { site_list: siteID, datasource: 'AT' },
      },
      {
        function: 'get_variable_list',
        version: 1,
        params: { site_list: siteID, datasource: 'A' },
      },
      {
        function: 'get_variable_list',
        version: 1,
        params: { site_list: siteID, datasource: 'ATQ' },
      },
    ],
  },
});

const apiGetWaterDataQueryUrl = (siteID) =>
  BASE_URL + JSON.stringify(firstQuery(siteID));

const apiGetWaterData = async (siteID) => {
  console.log('apiGetWaterDataQueryUrl  ', apiGetWaterDataQueryUrl(siteID));
  dataResponceElm.innerHTML = LOADING;
  groupedLatestVariablesByVaribleElm.innerHTML = LOADING;
  latestVariableElm.innerHTML = LOADING;
  try {
    const response = await axios.get(apiGetWaterDataQueryUrl(siteID));
    console.log(response);
    dataResponceElm.innerHTML = prettyPrintJson.toHtml(response.data);

    getAvailableData(response.data);
  } catch (error) {
    console.error(error);
  }
};

const apiGetLatestWaterData = async (latestQuery) => {
  console.log('latestQuery', latestQuery);
  apiGetLatestWaterDataElm.innerHTML = LOADING;
  try {
    const response = await axios.get(latestQuery);
    // console.log('apiGetLatestWaterDataresponse', apiGetLatestWaterData);
    apiGetLatestWaterDataElm.innerHTML = prettyPrintJson.toHtml(response.data);
  } catch (error) {
    console.error(error);
  }
};

const siteID = '922101B';

actionButtonElm.addEventListener(
  'click',
  () => apiGetWaterData(siteIdInputElm.value),
  false
);

// actionButtonElm.onclick(console.log('',siteIdInputElm.value))
