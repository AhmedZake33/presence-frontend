<template>
  <div>
    <loading :visible="load" text="Processing..." />

    <b-row>
      <b-col md="12">
        <b-row>
          <b-col md="6">
          <b-card style="height: 150px;">
            
            <h5 class="mt-3">Total Employees: <b-badge variant="success">{{ summary.totalEmployees }}</b-badge></h5>
            <h5>Total Managers: <b-badge variant="primary">{{ summary.totalManagers }}</b-badge></h5>
          </b-card>
          </b-col>
          <b-col md="6">
          <b-card style="height: 150px;">
            <h4 style="margin-top: 50px;">Present Today: <b-badge variant="primary">{{ summary.presentToday }}</b-badge></h4>
          </b-card>
          </b-col>
        </b-row>
        
      </b-col>
      <b-col md="12">
        <b-card title="Attendance Stats">
          <line-chart :data="chartData" :options="chartOptions"  style="height:300px;"  />
        </b-card>
      </b-col>
    </b-row>
  </div>
</template>

<script>
import api from "@/libs/axios";
import LineChart from '@/components/charts/LineChart.js'
import loading from "@/views/components/my-components/loading.vue";


export default {
  components: {
    LineChart, loading
  },
  data() {
    return {
      summary: {
        totalEmployees: 0,
        presentToday: 0,
        series: [],
        load: false
      },
      chartData: {
        labels: [],
        datasets: []
      },
      chartOptions: {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
        xAxes: [
        {
            offset: true,
            gridLines: {
            display: true,
            drawBorder: false,
            },
            ticks: {
            autoSkip: false,
            padding: 10,
            },
        },
        ],
        yAxes: [
        {
            ticks: {
            beginAtZero: true,
            },
        },
        ],
    },
    legend: {
        display: true,
        position: 'top',
    },
    }

    };
  },
  async created() {
    this.load = true
    const res = await api.get("/dashboard/summary");
    this.summary = res.data;
    const series = res.data.series || []
    this.load = false
    const labels = series.map(item => item.date)
    const values = series.map(item => item.cnt)
    this.chartData = {
        labels: labels,
        datasets: [
          {
            label: 'Attendance',
            data: values,
            borderColor: '#42A5F5',
            backgroundColor: 'rgba(66,165,245,0.2)',
            fill: false,          // no area fill
            lineTension: 0.1,     // makes smooth line (0 = straight)
            borderWidth: 2,
            pointRadius: 4,
            pointBackgroundColor: '#42A5F5',
            showLine: true,       // show line between points
                  type: 'line',            // 👈 force line type
          },
        ],
      }
  },
};
</script>
