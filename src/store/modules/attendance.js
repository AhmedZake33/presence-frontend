
import api from "@/libs/axios";

export default {
    namespaced: true,
    state: {
        checkinTime: null,
        checkoutTime: null,
    },
    getters: {
        isCheckedIn: (state) => !!state.checkinTime && !state.checkoutTime,
        startTime: (state) => state.checkinTime,
    },
    mutations: {
        SET_CHECKIN_TIME(state, time) {
            state.checkinTime = time;
        },
        SET_CHECKOUT_TIME(state, time) {
            state.checkoutTime = time;
        },
    },
    actions: {
        async fetchAttendanceStatus({ commit }) {
            try {
                const res = await api.get("/attendance/today");
                // Reuse logic from attendance.vue loosely but focused on extracting times
                const rows = res.data?.data ?? res.data ?? [];
                const checkin = rows.find((r) => r.type === "in");
                const checkout = rows.find((r) => r.type === "out");

                commit("SET_CHECKIN_TIME", checkin?.timestamp ? new Date(checkin.timestamp).getTime() : null);
                commit("SET_CHECKOUT_TIME", checkout?.timestamp ? new Date(checkout.timestamp).getTime() : null);
            } catch (err) {
                // quiet fail is ok for navbar widget
                console.error('Failed to fetch attendance status', err);
                commit("SET_CHECKIN_TIME", null);
                commit("SET_CHECKOUT_TIME", null);
            }
        },
    },
};
