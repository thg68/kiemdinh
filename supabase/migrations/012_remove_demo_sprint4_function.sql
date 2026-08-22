-- Sprint 7 readiness: go bo ham tao du lieu demo khoi moi truong dung that.
-- Khong xoa migration cu da ap dung; chi thu hoi quyen va drop function hien tai.

revoke all on function fn_tao_du_lieu_demo_sprint4() from public;
revoke all on function fn_tao_du_lieu_demo_sprint4() from authenticated;

drop function if exists fn_tao_du_lieu_demo_sprint4();
