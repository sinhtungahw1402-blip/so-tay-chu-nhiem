@echo off
chcp 65001 > nul
title Sổ Chủ Nhiệm Số - Ứng Dụng Quản Lý Lớp Học
cls
echo ======================================================================
echo          📱 SỔ CHỦ NHIỆM SỐ - QUẢN LÝ HỌC SINH VÀ NỀ NẾP LỚP
echo ======================================================================
echo.
echo  Đang khởi động ứng dụng...
echo  Sau khi hiện dòng "Network: http://...:5173", bạn có thể:
echo   1. Mở trên máy tính: http://localhost:5173
echo   2. Mở trên điện thoại: Nhập địa chỉ Network hiển thị bên dưới vào Safari/Chrome
echo      hoặc quét mã QR trên điện thoại (cùng kết nối chung mạng Wi-Fi)
echo.
echo ======================================================================
echo.
npm run dev -- --host
pause
