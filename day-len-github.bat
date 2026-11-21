@echo off
chcp 65001 > nul
title Đẩy Ứng Dụng Sổ Chủ Nhiệm Lên GitHub
cls
echo ======================================================================
echo          🚀 ĐẨY ỨNG DỤNG SỔ CHỦ NHIỆM LÊN GITHUB & GITHUB PAGES
echo ======================================================================
echo.
echo Bạn có thể chọn 1 trong 2 cách dưới đây:
echo.
echo [1] Đăng nhập tài khoản GitHub bằng công cụ tự động (gh auth login)
echo [2] Dán đường link kho lưu trữ GitHub của bạn (VD: https://github.com/.../...)
echo.
set /p choice="Nhập lựa chọn của bạn (1 hoặc 2): "

if "%choice%"=="1" (
    echo.
    echo Đang mở đăng nhập GitHub... (Nhấn Enter theo các câu hỏi mặc định)
    "C:\Program Files\GitHub CLI\gh.exe" auth login
    echo.
    echo Đang tạo kho lưu trữ trên GitHub và tải mã nguồn lên...
    "C:\Program Files\GitHub CLI\gh.exe" repo create so-tay-chu-nhiem --public --source=. --remote=origin --push
    goto DONE
)

if "%choice%"=="2" (
    echo.
    echo Hãy tạo 1 repository mới trên: https://github.com/new
    echo Đặt tên là: so-tay-chu-nhiem (chọn chế độ Public)
    echo.
    set /p repourl="Dán đường link repository GitHub của bạn vào đây: "
    "C:\Program Files\Git\cmd\git.exe" remote remove origin 2>nul
    "C:\Program Files\Git\cmd\git.exe" remote add origin %repourl%
    "C:\Program Files\Git\cmd\git.exe" push -u origin main
    goto DONE
)

:DONE
echo.
echo ======================================================================
echo ✅ ĐÃ HOÀN TẤT ĐẨY MÃ NGUỒN LÊN GITHUB!
echo.
echo 📱 BƯỚC CUỐI ĐỂ ỨNG DỤNG CHẠY TRÊN ĐIỆN THOẠI:
echo  1. Mở trang repository của bạn trên GitHub.
echo  2. Bấm vào mục "Settings" (Cài đặt) -> Chọn tab "Pages" ở cột bên trái.
echo  3. Tại mục "Source" (Nguồn), chọn: "GitHub Actions".
echo  4. Đợi 1 phút, GitHub sẽ cấp cho bạn đường link (VD: https://ten-ban.github.io/so-tay-chu-nhiem/).
echo  5. Mở đường link trên bằng Safari (iPhone) hoặc Chrome (Android) trên điện thoại:
echo     - iPhone: Bấm "Chia sẻ" -> Chọn "Thêm vào Màn hình chính".
echo     - Android: Bấm menu 3 chấm -> Chọn "Thêm vào Màn hình chính" / "Cài đặt ứng dụng".
echo.
echo ======================================================================
pause
